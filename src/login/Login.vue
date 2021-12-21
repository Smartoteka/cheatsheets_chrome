<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="px-8 py-6 mt-4 text-left bg-white shadow-lg">
      <div class="flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-20 h-20 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
          />
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-center">Login to your account</h3>

      <div class="mt-4">
        <div>
          <label class="block" for="email">Email</label>
          <input
            type="text"
            placeholder="Email"
            v-model="email"
            class="
              w-full
              px-4
              py-2
              mt-2
              border
              rounded-md
              focus:outline-none focus:ring-1 focus:ring-blue-600
            "
          />
          <span class="text-xs tracking-wide text-red-600"
            >{{ emailMessage }}
          </span>
        </div>
        <div class="mt-4">
          <label class="block">Login</label>
          <input
            type="text"
            placeholder="Login"
            v-model="login"
            class="
              w-full
              px-4
              py-2
              mt-2
              border
              rounded-md
              focus:outline-none focus:ring-1 focus:ring-blue-600
            "
          />
          <span class="text-xs tracking-wide text-red-600"
            >{{ loginMessage }}
          </span>
        </div>
        <div class="flex items-baseline justify-between">
          <button
            class="
              px-6
              py-2
              mt-4
              text-white
              bg-blue-600
              rounded-lg
              hover:bg-blue-900
            "
            @click="loginHandler"
          >
            Login
          </button>
          <button
            class="
              px-6
              py-2
              mt-4
              text-white
              bg-blue-600
              rounded-lg
              hover:bg-blue-900
            "
            @click="registerHandler"
          >
            Register
          </button>
          <!-- <a href="#" class="text-sm text-blue-600 hover:underline">Forgot password?</a> -->
        </div>
        <div class="flex items-baseline justify-between">
         <span class="text-xs tracking-wide text-red-600"
            >{{ sendMessage }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import storage from '@/utils/storage'
import { redirectCurrentTab } from '@/src_jq/common/commonFunctions'
import axios from '@/services/axios'

export default {
  name: 'Login',

  components: {},
  data() {
    return {
      login: '',
      email: '',
      emailMessage: '',
      loginMessage: '',
      sendMessage: '',
    }
  },
  props: {},
  beforeMount: function () {},
  mounted: function () {},
  updated: function () {},
  methods: {
    isValid() {
      this.emailMessage = ''
      this.loginMessage = ''

      let valid = true
      if (!this.email) {
        this.emailMessage = 'Email field is required'
        valid = false
      } else if (!this.validateEmail(this.email)) {
        this.emailMessage = 'Email should be valid'
        valid = false
      }

      if (!this.login) {
        this.loginMessage = 'Login field is required'
        valid = false
      }
      return valid
    },
    loginHandler() {
      if (!this.isValid()) {
        return false
      }

      axios
        .put('/Main', {
          login: this.login,
          email: this.email,
          extId: chrome.runtime.id,
          version: chrome.runtime.getManifest().version,
        })
        .then((response) => {
          let data = response.data

          if (data.isSuccess && data.result) {
            storage
              .set({ 'app-uuid': data.result })
              .then(() => redirectCurrentTab('/cheatsheets/page.html'))
          } else {
            this.sendMessage = data.displayMessage
          }
        })
        .catch((e) => {
          this.sendMessage = 'An error occurred while sending. Try it later or write for help'
        })
    },
    registerHandler() {
      if (!this.isValid()) {
        return false
      }

      axios
        .post('/Main', {
          login: this.login,
          email: this.email,
          extId: chrome.runtime.id,
          version: chrome.runtime.getManifest().version,
        })
        .then((response) => {
          let data = response.data

          if (data.isSuccess && data.result) {
            storage
              .set({ 'app-uuid': data.result })
              .then(() => redirectCurrentTab('/cheatsheets/page.html'))
          } else {
            this.sendMessage = data.displayMessage
          }
        })
        .catch((e) => {
          this.sendMessage = 'An error occurred while sending. Try it later or write for help'
        })
    },
    validateEmail(email) {
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        )
    },
  },
}
</script>

<style lang="css">
@import "./tailwind.min.css";
</style>
