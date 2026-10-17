const MAX_SIDE = 1200
const QUALITY = 0.8

/**
 * Reduz a foto para no máximo 1200px no maior lado e devolve um data URL JPEG.
 * O LocalStorage tem só alguns MB; uma foto de celular sem reduzir passaria disso sozinha.
 */
export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  // Fundo branco para PNGs com transparência não virarem preto no JPEG.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', QUALITY)
}
