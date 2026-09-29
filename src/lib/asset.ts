/** 静态资源路径。vite base 是相对路径，这里统一拼一次，别散落在各处 */
export const asset = (file: string) => `${import.meta.env.BASE_URL}${file.replace(/^\/+/, '')}`
