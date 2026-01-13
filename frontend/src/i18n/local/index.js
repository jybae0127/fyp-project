const modules = import.meta.glob('./*/*.js', { eager: true });

const messages = {};

Object.keys(modules).forEach((path) => {
  const match = path.match(/\.\/([^/]+)\/([^/]+)\.js$/);
  if (match) {
    const [, lang] = match;
    const module = modules[path];

    if (!messages[lang]) {
      messages[lang] = { translation: {} };
    }

    // Merge translation content
    if (module.default) {
      messages[lang].translation = {
        ...messages[lang].translation,
        ...module.default
      };
    }
  }
});

export default messages;
