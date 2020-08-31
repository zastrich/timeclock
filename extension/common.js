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
          fim: getDateHM(desc[0].time),
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
        fim: getDateHM(desc[0].time),
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

export { getDateHM, extractIntervals, dateFormat, openURL }