import { extractIntervals, dateFormat } from './common.js'

let alarms = []

const $ = (e) => document.querySelectorAll(e)

const setAlarms = (alarms, render = false) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({
      alarms
    }, (res) => {
      if(render) alarmsRender(alarms)
      
      resumeRender(alarms)

      resolve(alarms)
    })
  })
}

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

const resumeRender = (alarms) => {
  let html = ''
  if(alarms.length > 0){
    let intervals = extractIntervals(alarms)

    let work = intervals.filter(e => e.tipo === "work").reduce((acc, curr) => acc + curr.dif, 0)
    let notWork = intervals.filter(e => e.tipo === "notwork").reduce((acc, curr) => acc + curr.dif, 0)

    html = `<h2>Tempo de trabalho: <em>${dateFormat(work)}</em><h2><h2>Tempo de descanso: <em>${dateFormat(notWork)}</em></h2>`
  }

  $(".resume")[0].innerHTML = html
}

const alarmItemRender = (it, ind) => (`<div class="alarm-item ${!it.ativo && "inativo"}">
  <button class="btn btn-verm alarmRemove" title="Excluir">x</button>
  <input type="time" name="time-${ind}" placeholder="09:00" value="${it.time}" />
  <input type="text" name="label-${ind}" placeholder="Alerta" value="${it.label}" />
  <input type="text" name="url-${ind}" placeholder="URL do seu Relógio Ponto" value="${it.url}" />
  <select name="contagem-${ind}">
    <option ${it.contagem === "Trabalho" && "selected"}>Trabalho</option>
    <option ${it.contagem === "Descanso" && "selected"}>Descanso</option>
    <option ${it.contagem === "Aviso" && "selected"}>Aviso</option>
  </select>
  <input type="checkbox" name="ativo-${ind}" title="${it.ativo ? "Desativar" : "Ativar"}" ${it.ativo && "checked"} />
</div>`)

const HM = (data) => {
  if(data){
    return `${new Date(data).getHours().toString().padStart(2,0)}:${new Date(data).getMinutes().toString().padStart(2,0)}`
  } else {
    return `${new Date().getHours().toString().padStart(2,0)}:${new Date().getMinutes().toString().padStart(2,0)}`
  }
}

const alarmsRender = (PAlarms) => {
  let html = ""

  PAlarms.forEach((item, ind) => {
    html += alarmItemRender(item, ind)
  })

  if(PAlarms.length > 0)
    $("#alarms")[0].innerHTML = html
  else
  $("#alarms")[0].innerHTML = '<h2>Sem alertas configurados</h2>'

  $(".alarmRemove").forEach((item, ind) => {
    item.addEventListener('click', () => alarmRemove(ind))
  })

  $("input, select").forEach((item) => {
    item.addEventListener('change', (e) => {
      let [ name, ind ] = e.target.name.split("-")
      let chObj = {}
      chObj[name] = e.target.value

      if(name === "ativo"){
        chObj[name] = e.target.checked
      }
      
      alarms = alarms.map((it,ii) => ii === parseInt(ind) ? {...it, ...chObj} : it)
      
      setAlarms(alarms, (name === "ativo"))
    })
  })
  
  setAlarms(PAlarms)
}

const alarmRemove = (ind) => {
  alarms = alarms.filter((it,ii) => ii != ind)
  alarmsRender(alarms)
}

document.addEventListener('DOMContentLoaded', async () => {
  alarms = await getAlarms()

  alarmsRender(alarms)

  $("#alarm_activate")[0].addEventListener("click", () => {
    if(alarms.filter(e => e.ativo).length === alarms.length){
      alarms = alarms.map(it => ({...it, ...{ativo: false}}))
    } else {
      alarms = alarms.map(it => ({...it, ...{ativo: true}}))
    }

    setAlarms(alarms, true)
  })

  $("#alarm_add")[0].addEventListener("click", () => {
    alarms = [...alarms, {
      time: HM(),
      label: "Novo alerta",
      contagem: (alarms.length > 1 && alarms[(alarms.length - 1)].contagem === "Trabalho" ? "Descanso" : "Trabalho" ),
      url: "",
      ativo: true
    }]

    alarmsRender(alarms)
  })
})