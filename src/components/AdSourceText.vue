<template>
  <div class="source-box relative mt-1 rounded px-2 py-1">
    <div ref="textEl" class="source-text whitespace-pre-line break-words text-sm text-grey-9">{{ shown }}</div>
    <!-- Tugma 2-qator oxirida turadi; uning ostidagi matn oxiri quti fonida so'nadi -->
    <div v-if="truncated" class="source-more">
      <q-btn
        flat
        dense
        no-caps
        size="sm"
        color="primary"
        :label="t('common.showMore')"
        aria-haspopup="dialog"
        @click="emit('more')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// Asl matn ko'pi bilan 2 qator ko'rinadi; to'liq matn "Ko'proq" bilan tashqarida ochiladi
const props = defineProps<{ text: string }>();
const emit = defineEmits<{ more: [] }>();

const { t } = useI18n();

// Bo'sh qatorlar 2 qatorlik joyni yemasin — Telegram xabarlarida ular ko'p
const shown = computed(() =>
  props.text
    .split('\n')
    .filter((line) => line.trim())
    .join('\n'),
);

const textEl = ref<HTMLElement | null>(null);
const truncated = ref(false);

// CSS 2 qatorda qirqadi: qirqilgan bo'lsa matnning to'liq balandligi ko'rinadiganidan katta.
// Qatorlar soni kenglik va shriftga bog'liq, shuning uchun ular o'zgarganda qayta o'lchanadi.
function measure() {
  const el = textEl.value;
  if (el) truncated.value = el.scrollHeight > el.clientHeight + 1;
}

let observer: ResizeObserver | undefined;

onMounted(() => {
  measure();
  if (textEl.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure);
    observer.observe(textEl.value);
  }
  // Veb-shrift yuklangach matn kengligi o'zgaradi
  void document.fonts.ready.then(measure);
});

onBeforeUnmount(() => observer?.disconnect());

watch(shown, () => void nextTick(measure));
</script>

<style scoped>
/* Tugma ostidagi matn oxirini so'ndirish uchun gradient shu fon rangiga o'tadi */
.source-box {
  --source-bg: #f5f5f5;
  background: var(--source-bg);
}
.source-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
/* Quti ichki bo'shlig'i (px-2 py-1) va matn qatori balandligi (text-sm = 1.25rem) bilan mos:
   tugma 2-qator bilan bir chiziqda, o'ng chetda. Quasar .flex qatorni o'raydi, shuning uchun oddiy flex. */
.source-more {
  position: absolute;
  right: 0.5rem;
  bottom: 0.25rem;
  display: flex;
  align-items: center;
  height: 1.25rem;
  padding-left: 2rem;
  background: linear-gradient(to right, transparent, var(--source-bg) 2rem);
}
</style>
