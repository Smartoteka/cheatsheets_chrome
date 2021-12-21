<template>
  <nav class="nav">
    <a v-for="l in links" :key="l.url" :href="l.url"
      ><img
        class="ctrl-img"
        :src="'/images/' + l.icon"
        :title="l.title"
        v-on:click.prevent="openTab(l.url)"
    /></a>
    <slot></slot>
  </nav>
</template>

<script>
import { redirectCurrentTab, openTabs } from '@/src_jq/common/commonFunctions'

export default {
  props: {
    popup: {
      type: Boolean,
      default: false,
    },
  },
  components: {},
  data() {
    return {
      links: [
        {
          url: '../src_jq/settings/settings.html',
          title: 'settings',
          icon: 'settings.svg',
        },
      ],
      tag: '',
      tags: [],
    }
  },
  mounted() {
    if (this.popup) {
      this.links.unshift({
        url: '../cheatsheets/page.html',
        title: 'fullscreen',
        icon: 'maximize-2.svg',
      })
    }
  },
  computed: {},
  methods: {
    openTab: function (url) {
      if (this.popup) {
        openTabs([{ url: url }])
        window.close()
        return
      }

      redirectCurrentTab(url)
    },
  },
}
</script>

<style lang="scss">
.nav {
  height: 50px;
  display: flex;
  padding: 0 20px;
  flex-direction: row;
  column-gap: 10px;
  //justify-content: space-between;
  align-items: center;
  font-size: 1.125rem;
  box-shadow: 0 0 4px rgba($color: black, $alpha: 0.1);
}
</style>
