<template>
  <div class="flex flex-col gap-4">
    <!-- Holat -->
    <q-card flat bordered class="p-3">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <q-icon
            :name="status?.connected ? 'wifi' : 'wifi_off'"
            :color="status?.connected ? 'positive' : 'grey'"
            size="22px"
          />
          <span class="font-bold">{{ t('telegram.title') }}</span>
          <q-badge :color="status?.connected ? 'positive' : status?.configured ? 'orange' : 'grey'">
            {{
              status?.connected
                ? t('telegram.connected')
                : status?.configured
                  ? t('telegram.disconnected')
                  : t('telegram.notConfigured')
            }}
          </q-badge>
        </div>
        <div class="flex gap-1">
          <q-btn
            flat
            dense
            icon="refresh"
            :loading="loadingStatus"
            :aria-label="t('common.refresh')"
            @click="refreshAll"
          />
          <q-btn
            flat
            dense
            no-caps
            icon="sync"
            :label="t('telegram.reconnect')"
            :loading="reconnecting"
            :disable="!status?.configured || status?.sessionInvalid"
            @click="reconnect"
          />
        </div>
      </div>

      <div v-if="status" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
        <div>
          <div class="text-grey-7">{{ t('telegram.sources') }}</div>
          <div class="font-medium">{{ status.sources.length }}</div>
        </div>
        <div>
          <div class="text-grey-7">{{ t('telegram.savedSinceStart') }}</div>
          <div class="font-medium">{{ status.messagesSaved }}</div>
        </div>
        <div>
          <div class="text-grey-7">{{ t('telegram.lastMessage') }}</div>
          <div class="font-medium">{{ formatDateTime(status.lastMessageAt, locale) || '—' }}</div>
        </div>
        <div>
          <div class="text-grey-7">{{ t('telegram.ai') }}</div>
          <div class="font-medium flex items-center gap-1 flex-wrap">
            <q-toggle
              :model-value="status.ai.enabled"
              dense
              color="positive"
              :disable="aiToggling || !status.ai.configured"
              :label="status.ai.enabled ? t('telegram.aiOn') : t('telegram.aiOff')"
              @update:model-value="(v: boolean) => onAiToggle(v)"
            />
            <span class="text-grey-7 text-xs">{{ status.ai.provider }} · {{ status.ai.model }}</span>
            <span v-if="status.ai.retryAt" class="text-warning text-xs">
              {{ t('telegram.aiLimited', { time: formatDateTime(status.ai.retryAt, locale) }) }}
            </span>
            <span
              v-else-if="status.ai.providerInfo"
              :class="status.ai.configured ? 'text-grey-7' : 'text-negative'"
              class="text-xs"
            >
              {{ status.ai.providerInfo }}
            </span>
            <span v-else-if="!status.ai.configured" class="text-negative text-xs">
              {{ t('telegram.aiNotConfigured') }}
            </span>
          </div>
          <div class="text-xs text-grey-7">
            {{ t('telegram.aiProcessed') }}: {{ status.ai.processedSinceStart }} /
            {{ status.ai.adsCreatedSinceStart }}
          </div>
          <div class="text-xs text-grey-7">
            {{ t('telegram.duplicatesSkipped') }}: {{ status.ai.duplicatesSinceStart ?? 0 }}
          </div>
        </div>
      </div>
      <div v-if="status?.lastError && !status.sessionInvalid" class="text-negative text-sm mt-2">
        {{ t('telegram.lastError') }}: {{ status.lastError }}
      </div>
      <div v-if="aiError" class="text-negative text-sm mt-1">AI: {{ aiError }}</div>
    </q-card>

    <!-- Telegram hisobi: kirish / chiqish -->
    <q-card flat bordered class="p-3">
      <div class="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div class="font-bold">{{ t('telegram.account') }}</div>
        <q-btn
          v-if="status?.configured && !status.sessionInvalid"
          flat
          dense
          no-caps
          icon="logout"
          color="negative"
          :label="t('telegram.logout')"
          @click="logoutDialog = true"
        />
      </div>

      <q-banner v-if="status?.sessionInvalid" dense rounded class="bg-orange-1 text-grey-9 mb-3">
        <template #avatar><q-icon name="warning" color="orange" /></template>
        {{ t('telegram.sessionInvalid') }}
      </q-banner>
      <q-banner v-else-if="status && !status.configured" dense rounded class="bg-blue-1 text-grey-9 mb-3">
        <template #avatar><q-icon name="info" color="primary" /></template>
        {{ t('telegram.noSession') }}
      </q-banner>

      <!-- 1-qadam: telefon -->
      <q-form
        v-if="loginStep === 'idle' || loginStep === 'error' || loginStep === 'done'"
        class="flex gap-2 items-start flex-wrap"
        @submit.prevent="loginStart"
      >
        <q-input
          v-model="loginPhone"
          dense
          outlined
          type="tel"
          class="min-w-[240px]"
          :label="t('telegram.phone')"
          :hint="t('telegram.phoneHint')"
          :rules="[(v) => !!v || t('common.required')]"
          lazy-rules
        />
        <q-btn color="primary" icon="send" :label="t('telegram.sendCode')" :loading="loginBusy" type="submit" />
      </q-form>

      <!-- 2-qadam: kod -->
      <q-form
        v-else-if="loginStep === 'waiting_code'"
        class="flex flex-col gap-2"
        @submit.prevent="loginCode"
      >
        <div class="text-sm">{{ t('telegram.codeSent') }} <span class="text-grey-7">({{ login?.phone }})</span></div>
        <div class="flex gap-2 items-start flex-wrap">
          <q-input
            v-model="loginCodeValue"
            dense
            outlined
            inputmode="numeric"
            autocomplete="one-time-code"
            class="min-w-[160px]"
            :label="t('telegram.code')"
            :rules="[(v) => !!v || t('common.required')]"
            lazy-rules
          />
          <q-btn color="primary" :label="t('telegram.confirm')" :loading="loginBusy" type="submit" />
          <q-btn flat :label="t('common.cancel')" :disable="loginBusy" @click="loginCancel" />
        </div>
      </q-form>

      <!-- 3-qadam: 2FA parol -->
      <q-form
        v-else-if="loginStep === 'waiting_password'"
        class="flex flex-col gap-2"
        @submit.prevent="loginPassword"
      >
        <div class="text-sm">
          {{ t('telegram.needPassword') }}
          <span v-if="login?.hint" class="text-grey-7">{{ t('telegram.passwordHint', { hint: login.hint }) }}</span>
        </div>
        <div class="flex gap-2 items-start flex-wrap">
          <q-input
            v-model="loginPasswordValue"
            dense
            outlined
            :type="showLoginPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="min-w-[220px]"
            :label="t('telegram.password')"
            :rules="[(v) => !!v || t('common.required')]"
            lazy-rules
          >
            <template #append>
              <q-icon
                :name="showLoginPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showLoginPassword = !showLoginPassword"
              />
            </template>
          </q-input>
          <q-btn color="primary" :label="t('telegram.confirm')" :loading="loginBusy" type="submit" />
          <q-btn flat :label="t('common.cancel')" :disable="loginBusy" @click="loginCancel" />
        </div>
      </q-form>

      <!-- Jarayon -->
      <div v-else class="flex items-center gap-2 text-sm text-grey-7">
        <q-spinner size="18px" color="primary" />
        {{ t('telegram.working') }}
        <q-btn flat dense :label="t('common.cancel')" @click="loginCancel" />
      </div>

      <div v-if="login?.error" class="text-negative text-sm mt-2">{{ login.error }}</div>
    </q-card>

    <!-- Manbalar -->
    <q-card flat bordered class="p-3">
      <div class="font-bold mb-2">{{ t('telegram.sources') }}</div>
      <q-form class="flex gap-2 items-start flex-wrap mb-2" @submit.prevent="addSource">
        <q-input
          v-model="newLink"
          dense
          outlined
          class="flex-1 min-w-[260px]"
          :label="t('telegram.linkLabel')"
          :hint="t('telegram.linkHint')"
          :rules="[(v) => !!v || t('common.required')]"
          lazy-rules
        />
        <q-input
          v-model="newTitle"
          dense
          outlined
          class="min-w-[180px]"
          :label="t('telegram.sourceTitle')"
        />
        <q-btn
          color="primary"
          icon="add"
          :label="t('telegram.addSource')"
          :loading="adding"
          type="submit"
        />
      </q-form>
      <div v-if="addError" class="text-negative text-sm mb-2">{{ addError }}</div>

      <q-table
        :rows="sources"
        :columns="sourceColumns"
        row-key="_id"
        flat
        dense
        :loading="loadingSources"
        :no-data-label="t('common.noData')"
        :rows-per-page-options="[0]"
        hide-pagination
      >
        <template #body-cell-isActive="{ row }">
          <q-td>
            <q-toggle
              :model-value="row.isActive"
              dense
              :disable="togglingId === row._id"
              @update:model-value="(v: boolean) => toggleSource(row, v)"
            />
          </q-td>
        </template>
        <template #body-cell-title="{ row }">
          <q-td>
            <div>{{ row.title || '—' }}</div>
            <div class="text-xs text-grey-6">{{ row.link }}</div>
          </q-td>
        </template>
        <template #body-cell-chatId="{ row }">
          <q-td>{{ row.chatId || t('telegram.notResolved') }}</q-td>
        </template>
        <template #body-cell-topicId="{ row }">
          <q-td>{{ row.topicId ?? t('telegram.allTopics') }}</q-td>
        </template>
        <template #body-cell-resolveError="{ row }">
          <q-td>
            <span v-if="row.resolveError" class="text-negative text-xs">{{ row.resolveError }}</span>
            <q-icon v-else-if="row.lastResolvedAt" name="check_circle" color="positive" size="18px" />
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>
        <template #body-cell-actions="{ row }">
          <q-td class="text-right">
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              :aria-label="t('common.delete')"
              @click="askDeleteSource(row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Xabarlar -->
    <q-card flat bordered class="p-3">
      <div class="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div class="font-bold">
          {{ t('telegram.messages') }}
          <span class="text-grey-7 font-normal text-sm">{{ t('telegram.total', { n: total }) }}</span>
        </div>
        <div class="flex gap-2 items-center flex-wrap">
          <q-select
            v-model="filterChat"
            dense
            outlined
            clearable
            :options="chatOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            :label="t('telegram.chat')"
            style="min-width: 200px"
            behavior="menu"
            @update:model-value="loadMessages"
          />
          <q-select
            v-model="filterProcessed"
            dense
            outlined
            :options="processedOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            :label="t('telegram.status')"
            style="min-width: 150px"
            behavior="menu"
            @update:model-value="loadMessages"
          />
          <q-toggle v-model="autoRefresh" dense :label="t('telegram.autoRefresh')" />
        </div>
      </div>

      <q-table
        :rows="messages"
        :columns="messageColumns"
        row-key="_id"
        flat
        dense
        wrap-cells
        class="tg-messages"
        :loading="loadingMessages"
        :no-data-label="t('telegram.noMessages')"
        :rows-per-page-label="t('common.rowsPerPage')"
        :pagination="{ rowsPerPage: 20 }"
      >
        <template #body-cell-time="{ row }">
          <q-td class="whitespace-nowrap">{{ formatDateTime(row.sentAt || row.createdAt, locale) }}</q-td>
        </template>
        <template #body-cell-chat="{ row }">
          <q-td>
            <div>{{ row.chatTitle || row.chatId }}</div>
            <div v-if="row.topicId" class="text-xs text-grey-6">topic {{ row.topicId }}</div>
          </q-td>
        </template>
        <template #body-cell-sender="{ row }">
          <q-td>
            <div>{{ row.fullName || '—' }}</div>
            <div class="text-xs text-grey-6">
              {{ [row.username, row.userPhone].filter(Boolean).join(' · ') }}
            </div>
          </q-td>
        </template>
        <template #body-cell-message="{ row }">
          <q-td style="max-width: 420px">
            <div class="whitespace-pre-line text-sm">{{ messageText(row) }}</div>
            <q-btn
              v-if="isLongMessage(row)"
              flat
              dense
              no-caps
              size="sm"
              color="primary"
              class="mt-1"
              :label="expandedIds.has(row._id) ? t('common.showLess') : t('common.showMore')"
              @click="toggleExpanded(row._id)"
            />
          </q-td>
        </template>
        <template #body-cell-state="{ row }">
          <q-td>
            <q-badge v-if="row.skipReason === 'duplicate'" color="blue-grey">
              {{ t('telegram.duplicate') }}
            </q-badge>
            <q-badge v-else-if="row.skipReason === 'empty'" color="grey-6">
              {{ t('telegram.noText') }}
            </q-badge>
            <q-badge v-else :color="row.isProcessed ? (row.aiError ? 'orange' : 'positive') : 'grey'">
              {{ row.isProcessed ? t('telegram.processed') : t('telegram.unprocessed') }}
            </q-badge>
            <div v-if="row.adsCreated" class="text-xs text-grey-7">
              {{ t('telegram.adsCreated') }}: {{ row.adsCreated }}
            </div>
            <div v-if="row.aiError" class="text-xs text-negative">{{ row.aiError }}</div>
          </q-td>
        </template>
        <template #body-cell-actions="{ row }">
          <q-td class="text-right">
            <q-btn
              flat
              round
              dense
              icon="smart_toy"
              color="primary"
              :loading="processingId === row._id"
              :aria-label="t('telegram.processNow')"
              @click="processNow(row)"
            >
              <q-tooltip>{{ t('telegram.processNow') }}</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Manbani o'chirish -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-base">{{ t('telegram.confirmDeleteSource') }}</div>
          <div class="text-sm text-grey-7 mt-1">{{ deleteTarget?.title || deleteTarget?.link }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('common.cancel')" />
          <q-btn color="negative" :label="t('common.delete')" :loading="deleting" @click="deleteSource" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- AI ni yoqishni tasdiqlash (pul sarflaydi) -->
    <q-dialog v-model="aiEnableDialog" persistent>
      <q-card style="max-width: 460px">
        <q-card-section class="text-base">{{ t('telegram.aiEnableConfirm') }}</q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('common.cancel')" />
          <q-btn color="positive" :label="t('telegram.enable')" :loading="aiToggling" @click="setAi(true)" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Telegram hisobidan chiqish -->
    <q-dialog v-model="logoutDialog" persistent>
      <q-card>
        <q-card-section class="text-base">{{ t('telegram.confirmLogout') }}</q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('common.cancel')" />
          <q-btn color="negative" :label="t('telegram.logout')" :loading="loggingOut" @click="logout" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import {
  apiTelegramStatus,
  apiTelegramSources,
  apiTelegramAddSource,
  apiTelegramUpdateSource,
  apiTelegramDeleteSource,
  apiTelegramReconnect,
  apiTelegramMessages,
  apiTelegramProcessMessage,
  apiTelegramSetAi,
  apiTelegramLoginStart,
  apiTelegramLoginCode,
  apiTelegramLoginPassword,
  apiTelegramLoginCancel,
  apiTelegramLogout,
} from 'src/api';
import { getErrorMessage } from 'src/utils/error';
import { formatDateTime } from 'src/utils/format';
import type {
  TelegramLoginState,
  TelegramMessage,
  TelegramSource,
  TelegramStatus,
} from 'src/types';

const $q = useQuasar();
const { t, locale } = useI18n();

const REFRESH_MS = 10_000;
// Kod/parol kutilayotganda holat tez-tez tekshiriladi
const LOGIN_POLL_MS = 3_000;

// ── Holat ──
const status = ref<TelegramStatus | null>(null);

// Limit yoki login holati AI blokida allaqachon ko'rsatilgan — qizil qatorda takrorlanmasin
const aiError = computed(() => {
  const ai = status.value?.ai;
  if (!ai?.lastError || ai.retryAt || ai.lastError === ai.providerInfo) return null;
  return ai.lastError;
});
const loadingStatus = ref(false);
const reconnecting = ref(false);

// ── AI avtomatik qayta ishlash ──
const aiToggling = ref(false);
const aiEnableDialog = ref(false);

function onAiToggle(enabled: boolean) {
  // Yoqish pul sarflaydi — avval tasdiq so'raymiz; o'chirish darhol
  if (enabled) aiEnableDialog.value = true;
  else void setAi(false);
}

async function setAi(enabled: boolean) {
  aiToggling.value = true;
  try {
    const res = await apiTelegramSetAi(enabled);
    if (status.value) status.value = { ...status.value, ai: res.data.data };
    aiEnableDialog.value = false;
    $q.notify({
      type: enabled ? 'positive' : 'info',
      message: enabled ? t('telegram.aiEnabled') : t('telegram.aiDisabled'),
    });
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    aiToggling.value = false;
  }
}

// ── Telegram hisobiga kirish ──
const login = computed<TelegramLoginState | null>(() => status.value?.login ?? null);
const loginStep = computed(() => login.value?.step ?? 'idle');
const loginPhone = ref('');
const loginCodeValue = ref('');
const loginPasswordValue = ref('');
const showLoginPassword = ref(false);
const loginBusy = ref(false);
const logoutDialog = ref(false);
const loggingOut = ref(false);

// ── Manbalar ──
const sources = ref<TelegramSource[]>([]);
const loadingSources = ref(false);
const newLink = ref('');
const newTitle = ref('');
const adding = ref(false);
const addError = ref('');
const togglingId = ref<string | null>(null);
const deleteDialog = ref(false);
const deleteTarget = ref<TelegramSource | null>(null);
const deleting = ref(false);

// ── Xabarlar ──
const messages = ref<TelegramMessage[]>([]);
const total = ref(0);
const loadingMessages = ref(false);
const filterChat = ref<string | null>(null);
const filterProcessed = ref<'all' | 'true' | 'false'>('all');
const autoRefresh = ref(true);
const processingId = ref<string | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;
let loginTimer: ReturnType<typeof setInterval> | null = null;

const sourceColumns = computed<QTableColumn[]>(() => [
  { name: 'isActive', label: t('telegram.active'), field: 'isActive', align: 'left' },
  { name: 'title', label: t('common.name'), field: 'title', align: 'left' },
  { name: 'chatId', label: t('telegram.chatId'), field: 'chatId', align: 'left' },
  { name: 'topicId', label: t('telegram.topic'), field: 'topicId', align: 'left' },
  { name: 'resolveError', label: t('telegram.resolveState'), field: 'resolveError', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]);

const messageColumns = computed<QTableColumn[]>(() => [
  { name: 'time', label: t('telegram.time'), field: 'sentAt', align: 'left' },
  { name: 'chat', label: t('telegram.chat'), field: 'chatTitle', align: 'left' },
  { name: 'sender', label: t('telegram.sender'), field: 'fullName', align: 'left' },
  { name: 'message', label: t('telegram.text'), field: 'message', align: 'left' },
  { name: 'state', label: t('telegram.status'), field: 'isProcessed', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]);

const chatOptions = computed(() =>
  sources.value
    .filter((s) => s.chatId)
    .map((s) => ({ label: s.title || s.link, value: s.chatId as string })),
);

// Uzun xabarlar jadvalda qisqartirib ko'rsatiladi, "Ko'proq" bilan ochiladi
const PREVIEW_CHARS = 160;
const PREVIEW_LINES = 3;
const expandedIds = ref(new Set<string>());

function fullMessageText(row: TelegramMessage): string {
  return row.message || (row.isMediaExsist ? `[${t('telegram.media')}]` : '');
}

// Bo'sh qatorlar hisobga olinmaydi — Telegram xabarlarida ular ko'p bo'ladi
function contentLines(text: string): string[] {
  return text.split('\n').filter((line) => line.trim().length > 0);
}

function isLongMessage(row: TelegramMessage): boolean {
  const text = row.message ?? '';
  return text.length > PREVIEW_CHARS || contentLines(text).length > PREVIEW_LINES;
}

function messageText(row: TelegramMessage): string {
  const text = fullMessageText(row);
  if (!isLongMessage(row) || expandedIds.value.has(row._id)) return text;
  const firstLines = contentLines(text).slice(0, PREVIEW_LINES).join('\n');
  const preview = firstLines.length > PREVIEW_CHARS ? firstLines.slice(0, PREVIEW_CHARS) : firstLines;
  return preview.trimEnd() + '…';
}

function toggleExpanded(id: string) {
  const next = new Set(expandedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedIds.value = next;
}

const processedOptions = computed(() => [
  { label: t('telegram.filterAll'), value: 'all' },
  { label: t('telegram.processed'), value: 'true' },
  { label: t('telegram.unprocessed'), value: 'false' },
]);

// ── Yuklash ──
async function loadStatus() {
  loadingStatus.value = true;
  try {
    const res = await apiTelegramStatus();
    status.value = res.data.data;
  } catch {
    // interceptor xabar beradi
  } finally {
    loadingStatus.value = false;
  }
}

async function loadSources() {
  loadingSources.value = true;
  try {
    const res = await apiTelegramSources();
    sources.value = res.data.data;
  } catch {
    // interceptor xabar beradi
  } finally {
    loadingSources.value = false;
  }
}

async function loadMessages() {
  loadingMessages.value = true;
  try {
    const res = await apiTelegramMessages({
      chatId: filterChat.value ?? undefined,
      processed: filterProcessed.value === 'all' ? undefined : filterProcessed.value === 'true',
      page: 1,
      perPage: 100,
    });
    messages.value = res.data.data.items;
    total.value = res.data.data.total;
  } catch {
    // interceptor xabar beradi
  } finally {
    loadingMessages.value = false;
  }
}

function refreshAll() {
  void loadStatus();
  void loadSources();
  void loadMessages();
}

// ── Telegram hisobiga kirish ──
function applyLogin(state: TelegramLoginState) {
  if (status.value) status.value = { ...status.value, login: state };
  if (state.step === 'done') {
    $q.notify({ type: 'positive', message: t('telegram.loggedIn') });
    loginCodeValue.value = '';
    loginPasswordValue.value = '';
    setTimeout(() => void loadStatus(), 4000);
  }
}

async function loginStart() {
  const phone = loginPhone.value.trim();
  if (!phone) return;
  loginBusy.value = true;
  try {
    const res = await apiTelegramLoginStart(phone);
    applyLogin(res.data.data);
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    loginBusy.value = false;
  }
}

async function loginCode() {
  const code = loginCodeValue.value.trim();
  if (!code) return;
  loginBusy.value = true;
  try {
    const res = await apiTelegramLoginCode(code);
    applyLogin(res.data.data);
    if (res.data.data.step === 'waiting_code') loginCodeValue.value = '';
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    loginBusy.value = false;
  }
}

async function loginPassword() {
  const password = loginPasswordValue.value;
  if (!password) return;
  loginBusy.value = true;
  try {
    const res = await apiTelegramLoginPassword(password);
    applyLogin(res.data.data);
    loginPasswordValue.value = '';
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    loginBusy.value = false;
  }
}

async function loginCancel() {
  try {
    const res = await apiTelegramLoginCancel();
    applyLogin(res.data.data);
    loginCodeValue.value = '';
    loginPasswordValue.value = '';
    $q.notify({ type: 'info', message: t('telegram.loginCancelled') });
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  }
}

async function logout() {
  loggingOut.value = true;
  try {
    await apiTelegramLogout();
    logoutDialog.value = false;
    $q.notify({ type: 'positive', message: t('telegram.loggedOut') });
    void loadStatus();
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    loggingOut.value = false;
  }
}

// ── Amallar ──
async function reconnect() {
  reconnecting.value = true;
  try {
    await apiTelegramReconnect();
    $q.notify({ type: 'info', message: t('telegram.reconnecting') });
    setTimeout(() => void loadStatus(), 3000);
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    reconnecting.value = false;
  }
}

async function addSource() {
  addError.value = '';
  const link = newLink.value.trim();
  if (!link) return;
  adding.value = true;
  try {
    const res = await apiTelegramAddSource({ link, title: newTitle.value.trim() || undefined });
    sources.value = [...sources.value, res.data.data];
    newLink.value = '';
    newTitle.value = '';
    $q.notify({ type: 'positive', message: t('telegram.sourceAdded') });
    setTimeout(() => void loadSources(), 5000);
  } catch (err) {
    addError.value = getErrorMessage(err, t('common.error'));
  } finally {
    adding.value = false;
  }
}

async function toggleSource(row: TelegramSource, isActive: boolean) {
  togglingId.value = row._id;
  try {
    const res = await apiTelegramUpdateSource(row._id, { isActive });
    const idx = sources.value.findIndex((s) => s._id === row._id);
    if (idx >= 0) sources.value[idx] = res.data.data;
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    togglingId.value = null;
  }
}

function askDeleteSource(row: TelegramSource) {
  deleteTarget.value = row;
  deleteDialog.value = true;
}

async function deleteSource() {
  const target = deleteTarget.value;
  if (!target) return;
  deleting.value = true;
  try {
    await apiTelegramDeleteSource(target._id);
    sources.value = sources.value.filter((s) => s._id !== target._id);
    deleteDialog.value = false;
    deleteTarget.value = null;
    $q.notify({ type: 'positive', message: t('common.deleted') });
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    deleting.value = false;
  }
}

async function processNow(row: TelegramMessage) {
  processingId.value = row._id;
  try {
    const res = await apiTelegramProcessMessage(row._id);
    const { message, adsCreated, error, skipped, unavailable, retryAt } = res.data.data;
    const idx = messages.value.findIndex((m) => m._id === row._id);
    if (idx >= 0) messages.value[idx] = message;
    if (error && unavailable && retryAt) {
      $q.notify({
        type: 'warning',
        message: t('telegram.aiLimited', { time: formatDateTime(retryAt, locale.value) }),
      });
    } else if (error) {
      $q.notify({ type: 'negative', message: error });
    } else if (skipped === 'duplicate') {
      $q.notify({ type: 'info', message: t('telegram.markedDuplicate') });
    } else if (skipped === 'empty') {
      $q.notify({ type: 'info', message: t('telegram.noText') });
    } else {
      $q.notify({ type: 'positive', message: t('telegram.processResult', { n: adsCreated }) });
    }
    void loadStatus();
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    processingId.value = null;
  }
}

// ── Avto-yangilash ──
function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    void loadStatus();
    void loadMessages();
  }, REFRESH_MS);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// Kirish jarayonida (kod/parol kutilmoqda) holatni tezroq yangilaymiz
watch(loginStep, (step) => {
  const active = step === 'waiting_code' || step === 'waiting_password' || step === 'sending_code' || step === 'signing_in';
  if (active && !loginTimer) {
    loginTimer = setInterval(() => void loadStatus(), LOGIN_POLL_MS);
  } else if (!active && loginTimer) {
    clearInterval(loginTimer);
    loginTimer = null;
  }
});

watch(autoRefresh, (on) => (on ? startTimer() : stopTimer()));

onMounted(() => {
  refreshAll();
  if (autoRefresh.value) startTimer();
});

onUnmounted(() => {
  stopTimer();
  if (loginTimer) clearInterval(loginTimer);
});
</script>

<style scoped>
/* Uzun xabar ochilganda vaqt, chat, yuboruvchi va holat o'rtada emas, yuqorida tursin */
.tg-messages :deep(tbody td) {
  vertical-align: top;
}
</style>
