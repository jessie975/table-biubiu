<template>
  <ul :style="{top: menuTop+'px', left: menuLeft +'px'}" @click="handelClick">
    <li data-type="InsertRow">插入行(↓)</li>
    <li data-type="InsertColumn">插入列(→)</li>
    <li data-type="deleteRow">删除行</li>
    <li data-type="deleteColumn">删除列</li>
    <li data-type="mergeTd">合并单元格</li>
  </ul>
</template>

<script>
export default {
  name: 'Menu',
  props: {
    top: {
      type: Number,
      required: true
    },
    left: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      menuTop: this.top,
      menuLeft: this.left
    }
  },
  watch: {
    top(value) {
      this.menuTop = value
    },
    left(value) {
      this.menuLeft = value
    }
  },
  methods: {
    handelClick(event) {
      const { type } = event.target.dataset
      this.$emit(type)
      this.menuTop = -800
      this.menuLeft = -800
    }
  }
}
</script>

<style scoped>
ul,li {
  padding: 0;
  margin: 0;
  list-style: none;
}
li {
  text-align: center;
  padding: 8px 20px;
  user-select: none;
}
li:hover{
   box-shadow: 0px 0px 1px 1px rgba(164, 232, 227, 0.2);
}
ul {
   box-shadow: 0px 0px 10px 2px rgba(164, 232, 227, 0.26);
   background: #fff;
   width: 150px;
   box-sizing: border-box;
   position: fixed;
}
</style>

