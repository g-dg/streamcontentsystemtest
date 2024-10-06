<script lang="ts" setup>
const model = defineModel<boolean>();
</script>

<template>
  <div v-if="model" class="modal-background" @click="model = false">
    <div class="modal" @click.stop>
      <div class="modal-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--bg), 0.5);
  z-index: 1000;
}
.modal {
  display: inline-block;
  width: auto;
  background-color: rgb(var(--bg));
  box-shadow: 0px 0px 10px 0px rgb(var(--fg));
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}
.modal-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1em;
  min-width: 25vw;
  min-height: 25vh;
  max-width: 75vw;
  max-height: 75vh;
}
</style>
