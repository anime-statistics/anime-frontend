export default {
  '*.{ts,vue}': ['eslint --fix', 'oxlint -c oxlintrc.json'],
  '*.css': ['prettier --write'],
}
