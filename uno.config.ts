// uno.config.ts
import { defineConfig, presetUno, presetAttributify } from 'unocss';
import presetIcons from '@unocss/preset-icons';
import transformerVariantGroup from '@unocss/transformer-variant-group';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [transformerVariantGroup()],
  shortcuts: [
    [
      'btn',
      'px-4 py-2 rounded inline-block bg-blue-600 text-white cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:opacity-50',
    ],
  ],
});
