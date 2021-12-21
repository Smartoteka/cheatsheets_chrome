<template>
  <div class="dropdown">
    <div class="btn" @click="toggleDropdown($event)" />
    <transition name="grow">
      <ul class="menu" v-if="showDropdown" v-click-outside="closeDropdown">
        <li
          v-for="el in elements"
          :key="el.text"
          class="edit"
          @click="clickHandler(el)"
        >
          {{ el.text }}
        </li>
      </ul>
    </transition>
  </div>
</template>

<script>
import ClickOutsideEvent from '@/common/directives/ClickOutside'

export default {
  name: 'CheatSheet',
  components: {},
  directives: {
    'click-outside': ClickOutsideEvent,
  },
  props: {
    elements: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      showDropdown: false,
    }
  },
  methods: {
    clickHandler(el) {
      el.handler()
    },
    toggleDropdown(event) {
      this.showDropdown = !this.showDropdown
      event.stopPropagation()
    },
    closeDropdown() {
      this.showDropdown = false
    },
    clickAway() {
      this.showDropdown = false
    },
  },
}
</script>

<style lang="scss" scoped>
.dropdown {
  min-height: 2em;
  min-width: 2em;
  position: absolute;
  right: 0px;

  padding: 5px;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  .btn {
    width: 10px;
    height: 10px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #9dd5f1;
  }

  .menu {
    z-index: 1;
    min-width: 200px;
    min-height: 2em;
    position: absolute;
    top: 9px;
    right: 5px;
    background: white;
    flex-direction: column;
    width: 10rem;
    font-size: 0.95rem;
    border: 1px solid #9dd5f1;
    border-radius: 5px;
    display: flex;
    li {
      //padding: 0.5rem;
      transition: all 0.1s;
      border-bottom: 1px solid #e6f6fe;
      min-height: 2em;
    }
  }
}
</style>
