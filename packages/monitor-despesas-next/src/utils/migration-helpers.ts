export function warnLegacyUsage(fieldName: string, newFieldName: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️  DEPRECATION WARNING: Field '${fieldName}' is deprecated. ` +
      `Please use '${newFieldName}' instead. ` +
      `Legacy support will be removed in a future version.`
    );
  }
}