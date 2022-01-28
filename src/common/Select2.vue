<template>
  <span style="display: flex; width: 100%" @contextmenu="onContextMenu($event)">
    <span class="clear-filter">
      <img src="/images/x.svg" @click.self="clearAllFilters" />
    </span>
    <select style="flex-grow: 1">
      <slot></slot>
    </select>
  </span>
</template>

<script>
import $ from 'jquery'
import { unique, throttle } from '../src_jq/common/commonFunctions'
import {
  select2UpdateTags,
  generateAdditionalTagsFunction,
} from '../src_jq/common/mulitselectTagsHandlers'

import registerRestrictionMap from '../src_jq/common/restrictionMap'

import '../src_jq/libraries/select2'

import createMultiselectTags from '../src_jq/common/multiselectTags'
import { hashCode } from '@/src_jq/common/cheatSheetsManage'

window.$ = $

export default {
  name: 'select2',
  emits: ['tags-input', 'change', 'update:modelValue'],
  props: {
    options: Object,
    modelValue: Object,
    searchResults: Array,
    placeholder: String,
  },
  mounted: function () {
    let vm = this
    registerRestrictionMap()

    let sendUpdateEvent = throttle(() => vm.sendUpdateEvent(), 200)

    this.list = createMultiselectTags(
      this.selectList(),
      vm.$props.options,
      generateAdditionalTagsFunction(() => this.searchResults || []),
      this.placeholder,
    )

    select2UpdateTags(this.list, vm.$props.modelValue)

    this.list.on('change', sendUpdateEvent)

    $('.select2-search__field', this.$el).on('keypress', function (event) {
      vm.$emit('tags-input', event)
    })

    $('.select2-search__field', this.$el).on('onpaste', function (event) {
      vm.$emit('tags-input', event)
    })
  },
  watch: {
    modelValue: function (value) {
      this.setModelValue(value)
    },
    options: function (options) {
      const selectList = this.selectList()
      let modelValue = selectList.val()

      selectList.empty()

      options.forEach((val) => {
        let newOption = new Option(
          val.text,
          val.id,
          false,
          modelValue.findIndex((mv) => mv.id === val.id) >= 0,
        )
        selectList.append(newOption)
      })
      // this.selectList().val(modelValue).trigger('change')
    },
  },
  destroyed: function () {
    this.selectList().off().select2('destroy')
  },
  computed: {
    selectedTags() {
      let result = { count: 0 }

      let filterTags = $(this.$el)
        .select2('data')
        .map((el) => el.text)

      let countTags = 0
      result = unique(result, (el) => el).map((tag) => {
        countTags += 1
        result[tag] = countTags

        return 0
      })

      result.count = countTags

      return filterTags
    },
  },
  methods: {
    setModelValue(value) {
      let strVal = ''
      if (Array.isArray(value)) {
        strVal = JSON.stringify(
          unique(value.map((el) => ({
            id: typeof (el.id) === 'string' ? parseInt(el.id, 10) : el.id,
            text: el.text,
          })), el => el.id),
        )
      } else {
        strVal = JSON.stringify(value)
      }

      if (this.prevValue === strVal) return
      this.prevValue = strVal

      console.log('multiselect set value =' + strVal)

      if (Array.isArray(value)) {
        select2UpdateTags(this.selectList(), value)
      } else {
        // update value
        this.selectList().val(value).trigger('change')
      }

      this.$emit('update:modelValue', this.selectList().select2('data'))
      this.$emit('change')
    },
    onContextMenu(e) {
      let vm = this
      // prevent the browser's default menu
      e.preventDefault()
      e.stopPropagation()

      // shou our menu
      this.$contextmenu({
        x: e.pageX,
        y: e.pageY,
        items: [
          {
            label: 'Copy',
            onClick: () => {
              let text = vm.modelValue.map((el) => el.text).join(', ')
              navigator.clipboard.writeText(text)
            },
          },
          {
            label: 'Paste',
            onClick: () => {
              navigator.clipboard.readText().then((text) => {
                let tags = text
                  .split(',')
                  .map((el) => el.trim())
                  .map((el) => ({ id: '' + hashCode(el), text: el }))

                vm.setModelValue(vm.modelValue.concat(tags))
              })
            },
          },
        ],
      })
    },
    sendUpdateEvent: function () {
      console.log('change')

      this.setModelValue(this.selectList().select2('data'))
    },
    clearAllFilters() {
      this.selectList().val(null).trigger('change')
    },
    selectList() {
      return $('select', this.$el)
    },
  },
}
</script>
<style lang="scss" scoped>
@import "../src_jq/libraries/select2.min.css";

.clear-filter {
  margin: 5px 5px;

  width: 16px;
  height: 16px;
}
</style>
