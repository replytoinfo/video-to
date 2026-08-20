export const detectFormat = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext) return ext
  const match = /image\/(.+)/.exec(file.type)
  return match ? match[1] : ''
}
