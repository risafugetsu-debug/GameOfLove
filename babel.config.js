module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: [
      [
        'expo/internal/babel-preset',
        isTest ? { reanimated: false } : {},
      ],
    ],
    plugins: isTest ? [] : [],
  };
};
