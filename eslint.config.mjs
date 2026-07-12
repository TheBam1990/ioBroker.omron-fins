import config from '@iobroker/eslint-config';

export default [
    {
        ignores: [
            'admin/admin.d.ts',
            'admin/words.js',
            'gulpfile.js',
            'lib/adapter-config.d.ts',
            'lib/symbol-table.d.ts',
            'lib/tools.js',
        ],
    },
    ...config,
    {
        files: ['main.test.js', 'test/**/*.js'],
        languageOptions: {
            globals: {
                after: 'readonly',
                before: 'readonly',
                describe: 'readonly',
                it: 'readonly',
            },
        },
    },
];
