<template>
  <ul v-show="menuShow" :style="{top: top+'px', left: left +'px'}">
    <li @click="insertRow">插入行(↓)</li>
    <li @click="insertColumn">插入列(→)</li>
    <li @click="deleteRow">删除行</li>
    <li @click="deleteColumn">删除列</li>
    <li @click="mergeTd">合并单元格</li>
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
    },
    showMenu: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      menuShow: this.showMenu
    }
  },
  watch: {
    showMenu(value) {
      this.menuShow = value
    }
  },
  methods: {
    insertRow() {
      this.menuShow = !this.menuShow
      this.$emit('insertRow', this.showMenu)
    },
    insertColumn() {
      this.menuShow = !this.menuShow
      this.$emit('insertColumn', this.showMenu)
    },
    deleteRow() {
      this.menuShow = !this.menuShow
      this.$emit('deleteRow', this.showMenu)
    },
    deleteColumn() {
      this.menuShow = !this.menuShow
      this.$emit('deleteColumn', this.showMenu)
    },
    mergeTd() {
      this.menuShow = !this.menuShow
      this.$emit('mergeTd', this.showMenu)
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
