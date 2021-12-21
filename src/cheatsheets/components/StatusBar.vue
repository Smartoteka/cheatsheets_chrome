<template>
  <div>{{ message }}</div>
</template>

<script>
import storage from '@/utils/storage'
import axios from '@/services/axios'

export default {
  components: {},
  data() {
    return {
      message: '',
    }
  },
  mounted() {
    let today = new Date().toISOString().slice(0, 10)

    storage.get('check-update').then((checkUpdate) => {
      if (checkUpdate !== today) {
        storage.get('app-uuid').then((uuid) => {
          this.checkUpdate(uuid, today)
        })
      }
    })
  },
  computed: {},
  methods: {
    checkUpdate(uuid, today) {
      axios
        .get('/Main', {
          params: {
            uuid: uuid,
            extId: chrome.runtime.id,
            version: chrome.runtime.getManifest().version,
          },
        })
        .then((response) => {
          let data = response.data

          if (data.isSuccess) {
            storage.set({ 'check-update': today })
          }
          if (data.displayMessage) {
            this.message = data.displayMessage
          }
        })
        .catch((e) => {
          console.log(e)
        })
    },
  },
}
</script>

<style lang="scss">
</style>
