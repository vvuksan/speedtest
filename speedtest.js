const size = 1343591 * 8
const TEST_COUNT = 20

const image = new Image()
image.src = './fastly.svg'

const plugin = {
  id: 'customCanvasBackgroundImage',
  beforeDraw: chart => {
    if (image.complete) {
      const ctx = chart.ctx
      const { top, left, width, height } = chart.chartArea
      const x = left + width / 2 - image.width / 2
      const y = top + height / 2 - image.height / 2
      ctx.drawImage(image, x, y)
    } else {
      image.onload = () => chart.draw()
    }
  }
}

const data = {
  labels: [],
  datasets: [
    {
      label: 'Speed in MBps',
      data: [],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }
  ]
}

const config = {
  type: 'line',
  data: data,
  plugins: [plugin],
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }  
}

const ctx = document.getElementById('myChart')

const chart = new Chart(ctx, config)

const button = document.querySelector('button')
const progress = document.querySelector('.progress')
const speedText = document.querySelector('.speed-text')
let tcpRequest = new XMLHttpRequest()
let rtt = 5

let test_results = []

function loadImage () {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src =
      './test.gif?' +
      parseInt(Math.random() * 100000)
    let startTime = Date.now()

    img.onload = function () {
      let endTime = Date.now()
      console.log({ startTime, endTime, d: endTime - startTime })
      resolve(endTime - startTime)
    }

    img.onerror = function (err) {
      reject(err)
    }
  })
}

async function getLoadSpeed () {
  let loadTime = await loadImage()
  if (loadTime < 1) loadTime = 1
  let speed_bps = (1000 * size) / (loadTime - rtt)
  let speed_mbps = speed_bps / 1048576

  return speed_mbps
}

function getAvgSpeed () {
  let sum = test_results.reduce((a, b) => a + b, 0)

  return sum / test_results.length
}

function addData (label, newData) {
  chart.data.labels.push(label)
  chart.data.datasets.forEach(dataset => {
    dataset.data.push(newData)
  })
  chart.update()
}

function removeData () {
  chart.data.labels.pop()
  chart.data.datasets.forEach(dataset => {
    dataset.data.pop()
  })
  chart.update()
}

fetch('/tcpinfo')
  .then(response => response.json())
  .then(data => (rtt = (data.rtt/1000)))
  .then(() => {
    button.addEventListener('click', async function (e) {
      e.preventDefault()
      speedText.innerText = 'Test Started ...'
      removeData()
      console.log("RTT " + rtt)
      for (let i = 0; i < TEST_COUNT; i++) {
        let speed = await getLoadSpeed()
        test_results.push(speed)
        progress.style.width = ((i + 1) / TEST_COUNT) * 100 + '%'
        addData(i, speed)
        console.log({ i, speed })
        speedText.innerText =
          'Average Speed ' + getAvgSpeed().toFixed(2) + ' Mbps'
      }
    })
  })
  .catch(err => console.error(err))