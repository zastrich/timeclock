'use strict';

let alarms = []
let ind = 0

const getAlarms = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({
      alarms: []
    }, (items) => {
      let { alarms } = items
      resolve(alarms)
    })
  })
}

const timerAlarms = async () => {
  alarms = await getAlarms()
  chrome.browserAction.setBadgeText({ text: "" })

  let aviso = false

  // Verifica se existem alertas nos próximos 15 minutos
  alarms.filter(e => (e.contagem === "Aviso" && e.ativo)).map(e => {
    const dateDiff = parseInt((getDateHM(e.time) - Date.now())/1000)
    
    if(dateDiff <= (15*60) && dateDiff > 0){
      chrome.browserAction.setBadgeText({ text: dateFormat(dateDiff) })
      chrome.browserAction.setBadgeBackgroundColor({ color: "#f45" })

      aviso = true

      if(dateDiff === 1) openURL(e.url)
    }
  })
  
  if(!aviso){
    const interval = extractIntervals(alarms)

    if(interval.length > 0){
      const now = Date.now()

      let temWork = false
      const work = interval.filter(e => e.tipo === "work")

      work.forEach((interval, i) => {
        if(now > interval.ini && now < interval.fim){
          if(i === (work.length - 1)){
            // Último intervalo, soma os anteriores
            chrome.browserAction.setBadgeBackgroundColor({ color: "#0078D4" })
            let dateDiff = work.slice(0, i).reduce((acc, curr) => acc + curr.dif, 0)
            dateDiff += ((now - interval.ini)/1000)
            chrome.browserAction.setBadgeText({ text: dateFormat(dateDiff) })
          } else {
            // Tem mais intervalos de trabalho, regride até a próxima parada
            chrome.browserAction.setBadgeBackgroundColor({ color: "#bd13df" })
            const dateDiff = (interval.fim - now)/1000
            chrome.browserAction.setBadgeText({ text: dateFormat(dateDiff) })
          }

          temWork = true
        }

        // if(((now - interval.ini)/1000) === 1) openURL(interval.url)
      })

      let temNotWork = false

      if(!temWork){
        const notwork = interval.filter(e => e.tipo === "notwork")
  
        notwork.forEach((interval, i) => {
          if(now > interval.ini && now < interval.fim){
            // Soma a pausa
            chrome.browserAction.setBadgeBackgroundColor({ color: "#007523" })
            const dateDiff = (now - interval.ini)/1000
            chrome.browserAction.setBadgeText({ text: dateFormat(dateDiff) })
  
            temNotWork = true
          }
        })
      }

      if(!temWork && !temNotWork){
        // Tempo para iniciar o primeiro internvalo de trabalho
        if(now < work[0].ini){
          chrome.browserAction.setBadgeBackgroundColor({ color: "#007523" })
          const dateDiff = (work[0].ini - now)/1000
          chrome.browserAction.setBadgeText({ text: dateFormat(dateDiff) })
        }
      }
    }
  }
}

const initExtension = async () => {
  alarms = await getAlarms()
  
  setInterval(timerAlarms, 1000)
}

initExtension()


// COPY common.js
const getDateHM = (HM) => {
  let hmAr = HM.split(":")

  return new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), hmAr[0], hmAr[1], 0)
}

const extractIntervals = (alarms) => {
  const intervals = []

  alarms.forEach((alarm, i) => {
    if(alarm.contagem === "Trabalho" && alarm.ativo){
      const desc = alarms.slice(i+1).filter(e => (e.contagem === "Descanso" && e.ativo))
    
      if(desc.length > 0){
        let dateDiff = parseInt((getDateHM(desc[0].time) - getDateHM(alarm.time))/1000)
        
        intervals.push({
          ini: getDateHM(alarm.time),
          iniAlarm: alarm,
          fim: getDateHM(desc[0].time),
          fimAlarm: alarm,
          dif: dateDiff,
          tipo: "work"
        })
      }
    }

    if(alarm.contagem === "Descanso" && alarm.ativo){
      const desc = alarms.slice(i+1).filter(e => (e.contagem === "Trabalho" && e.ativo))
    
      if(desc.length > 0){
        let dateDiff = parseInt((getDateHM(desc[0].time) - getDateHM(alarm.time))/1000)
        
        intervals.push({
        ini: getDateHM(alarm.time),
        iniAlarm: alarm,
        fim: getDateHM(desc[0].time),
        fimAlarm: alarm,
        dif: dateDiff,
        tipo: "notwork"
        })
      }
    }
  })

  return intervals
}

const dateFormat = (secs) => {
  if(secs === 0){
    return '00:00'
  }

  if(secs < 60){
    return secs.toString().padStart(2,0)
  }

  if(secs < 3600){
    return `${parseInt(secs / 60).toString().padStart(2,0)}:${parseInt(secs % 60).toString().padStart(2,0)}`
  }

  return `${parseInt(secs / 60 / 60).toString().padStart(2,0)}:${parseInt((secs / 60) % 60).toString().padStart(2,0)}`
}

const openURL = (url) => {
  chrome.tabs.create({ url })
}