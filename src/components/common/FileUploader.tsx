import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props { onSelect: (files: File[]) => void; accept?: string; multiple?: boolean }

export default function FileUploader({ onSelect, accept='', multiple=false }:Props){
  const { t } = useLanguage()
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const open = () => inputRef.current?.click()
  
  const handle = (files: FileList) => {
    const fileArray = multiple ? Array.from(files) : [files[0]]
    
    // Проверяем тип файлов в зависимости от accept
    if (accept === 'image/*') {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.heic', '.heif', '.tiff', '.tif', '.ico', '.dng']
      const imageFiles = fileArray.filter(file => {
        const hasImageType = file.type.startsWith('image/')
        const hasImageExtension = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        return hasImageType || hasImageExtension
      })
      if (imageFiles.length === 0) {
        toast.error(t('fileUploaderInvalidImage'))
        return
      }
      if (imageFiles.length < fileArray.length) {
        toast.warning(t('fileUploaderNonImageIgnored').replace('{count}', String(fileArray.length - imageFiles.length)))
      }
      onSelect(imageFiles)
    } else if (accept === 'video/*') {
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv']
      const videoFiles = fileArray.filter(file => {
        const hasVideoType = file.type.startsWith('video/')
        const hasVideoExtension = videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        return hasVideoType || hasVideoExtension
      })
      if (videoFiles.length === 0) {
        toast.error(t('fileUploaderInvalidVideo'))
        return
      }
      if (videoFiles.length < fileArray.length) {
        toast.warning(t('fileUploaderNonVideoIgnored').replace('{count}', String(fileArray.length - videoFiles.length)))
      }
      onSelect(videoFiles)
    } else {
      onSelect(fileArray)
    }
  }
  
  return (
    <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files)}} className={`p-4 text-center bg-secondary/30 rounded-lg ${drag?'border-2 border-dashed border-primary bg-secondary':'hover:bg-secondary/50'}`}> 
      <input ref={inputRef} type="file" className="hidden" accept={accept} multiple={multiple} onChange={e=>{if(e.target.files) handle(e.target.files)}}/>
      <button onClick={open} className="btn-secondary">{t('browseFiles')}</button>
    </div>
  )
}
