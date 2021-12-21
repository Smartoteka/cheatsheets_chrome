<script>
export default {
  beforeMount: (el, binding) => {
    el.clickOutsideEvent = event => {
      // here I check that click was outside the el and his children
      if (!(el === event.target || el.contains(event.target))) {
        // and if it did, call method provided in attribute value
        binding.value(event)
      }
    }
    setTimeout(() => document.addEventListener('click', el.clickOutsideEvent), 100)
  },
  unmounted: el => {
    document.removeEventListener('click', el.clickOutsideEvent)
  },
}
</script>
