import { getSmartotekaFabric, standartHandle } from '../common/commonFunctions'

let smartotekaFabric = getSmartotekaFabric()

document.onreadystatechange = function () {
  registerSmartotekaHandlers()
  registerSpeedDealHandlers()

  function registerSpeedDealHandlers() {
    document.querySelector('#export-spead-deal-btn')
      .addEventListener('click', function (e) {
        smartotekaFabric
          .queriesProvider()
          .exportSpeedDeal('SpeedDeal' + new Date().toJSON().replaceAll(':', '_'))
      })

    let form = document.querySelector('#import-spead-deal-form')
    let file = document.querySelector('#import-spead-deal-file')

    form.addEventListener('submit', (event) => {
      // Stop the form from reloading the page
      event.preventDefault()

      // If there's no file, do nothing
      if (!file.value.length) { return }

      // Create a new FileReader() object
      let reader = new FileReader()

      // Setup the callback event to run when the file is read
      reader.onload = (e) => {
        let str = e.target.result
        let json = JSON.parse(str)

        standartHandle(smartotekaFabric.KBManager().importSpeedDeal(json))
      }

      // Read the file
      reader.readAsText(file.files[0])
    })
  }

  function registerSmartotekaHandlers() {
    document.querySelector('#export-all-btn')
      .addEventListener('click', (e) => {
        standartHandle(
          smartotekaFabric
            .queriesProvider()
            .export(new Date().toJSON().replaceAll(':', '_')),
        )
      })

    let form = document.querySelector('#import-form')
    let file = document.querySelector('#import-file')

    form.addEventListener('submit', (event) => {
      // Stop the form from reloading the page
      event.preventDefault()

      // If there's no file, do nothing
      if (!file.value.length) { return }

      // Create a new FileReader() object
      let reader = new FileReader()

      // Setup the callback event to run when the file is read
      reader.onload = (e) => {
        let str = e.target.result
        let json = JSON.parse(str)

        smartotekaFabric.KBManager().import(json)
      }

      // Read the file
      reader.readAsText(file.files[0])
    })
  }
}
