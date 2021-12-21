import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  attributify: true,
  extract: {
    include: [
      'src/**/*.{vue,html}',
    ],
    // A common use case is scanning files from the root directory
    // if you are excluding files, make sure you always include node_modules and .git
    exclude: ['node_modules', '.git', 'dist'],
  },
})
