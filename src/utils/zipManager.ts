import JSZip from 'jszip'
import { isSafariBrowser, supportsLargeBlobDownload, getMaxBlobSize } from './browserUtils'

export const createZip = async (files: {name: string; blob: Blob}[]) => {
  console.log('Creating ZIP with files:', files.map(f => ({name: f.name, size: f.blob.size})))
  const zip = new JSZip()
  files.forEach(f => {
    console.log(`Adding file to ZIP: ${f.name}, size: ${f.blob.size} bytes`)
    zip.file(f.name, f.blob)
  })
  const zipBlob = await zip.generateAsync({type:'blob'})
  console.log('Generated ZIP size:', zipBlob.size, 'bytes')
  return zipBlob
}

// Standard blob URL download method
const downloadBlobAsFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

// Safari-specific download using base64 DataURL with improved error handling
const downloadBlobSafari = async (blob: Blob, filename: string, retryCount = 0) => {
  console.log(`Using Safari base64 download method (attempt ${retryCount + 1})`)
  
  try {
    // Convert blob to base64 DataURL
    const reader = new FileReader()
    
    return new Promise<void>((resolve, reject) => {
      // Set timeout for very large files
      const timeout = Math.max(30000, blob.size / 1024) // At least 30s, more for larger files
      const timeoutId = setTimeout(() => {
        reader.abort()
        reject(new Error(`Timeout converting ${Math.round(blob.size / 1024 / 1024)}MB file to base64`))
      }, timeout)
      
      reader.onload = () => {
        try {
          clearTimeout(timeoutId)
          const dataUrl = reader.result as string
          
          if (!dataUrl || dataUrl.length === 0) {
            reject(new Error('Empty DataURL generated'))
            return
          }
          
          console.log(`Generated DataURL size: ${Math.round(dataUrl.length / 1024 / 1024)}MB`)
          
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = filename
          link.style.display = 'none'
          
          // Add additional attributes for Safari
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
          
          document.body.appendChild(link)
          
          // Use both click methods for better Safari compatibility
          link.click()
          
          // Trigger download event manually if needed
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          })
          link.dispatchEvent(event)
          
          // Clean up with longer delay for large files
          const cleanupDelay = Math.max(1000, blob.size / 1024 / 1024 * 100) // Scale with file size
          setTimeout(() => {
            try {
              if (document.body.contains(link)) {
                document.body.removeChild(link)
              }
            } catch (e) {
              console.warn('Failed to cleanup download link:', e)
            }
          }, cleanupDelay)
          
          console.log('Safari base64 download initiated successfully')
          resolve()
        } catch (error) {
          clearTimeout(timeoutId)
          reject(error)
        }
      }
      
      reader.onerror = (error) => {
        clearTimeout(timeoutId)
        console.error('FileReader error:', error)
        reject(new Error('Failed to convert blob to base64'))
      }
      
      reader.onabort = () => {
        clearTimeout(timeoutId)
        reject(new Error('FileReader aborted'))
      }
      
      // Start reading
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error(`Safari download failed on attempt ${retryCount + 1}:`, error)
    
    // Retry up to 2 times for transient errors
    if (retryCount < 2 && blob.size < 200 * 1024 * 1024) { // Only retry files < 200MB
      console.log('Retrying Safari download...')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      return downloadBlobSafari(blob, filename, retryCount + 1)
    }
    
    throw error
  }
}

// Alternative approach: Individual file downloads for Safari large files
const downloadIndividualFiles = async (files: {name: string; blob: Blob}[]) => {
  console.log('Using individual file download method for Safari')
  
  // Create download dialog for individual files
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '50%'
  container.style.left = '50%'
  container.style.transform = 'translate(-50%, -50%)'
  container.style.zIndex = '9999'
  container.style.background = 'white'
  container.style.padding = '20px'
  container.style.borderRadius = '8px'
  container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
  container.style.maxWidth = '500px'
  container.style.maxHeight = '70vh'
  container.style.overflow = 'auto'
  
  const title = document.createElement('h3')
  title.textContent = 'Safari Download - Individual Files'
  title.style.marginBottom = '15px'
  title.style.color = '#333'
  container.appendChild(title)
  
  const info = document.createElement('p')
  info.textContent = `ZIP file is too large for Safari. Download ${files.length} files individually:`
  info.style.marginBottom = '15px'
  info.style.color = '#666'
  info.style.fontSize = '14px'
  container.appendChild(info)
  
  // Download all button
  const downloadAllBtn = document.createElement('button')
  downloadAllBtn.textContent = `Download All ${files.length} Files`
  downloadAllBtn.style.width = '100%'
  downloadAllBtn.style.padding = '10px'
  downloadAllBtn.style.marginBottom = '15px'
  downloadAllBtn.style.background = '#007AFF'
  downloadAllBtn.style.color = 'white'
  downloadAllBtn.style.border = 'none'
  downloadAllBtn.style.borderRadius = '6px'
  downloadAllBtn.style.cursor = 'pointer'
  downloadAllBtn.style.fontSize = '16px'
  downloadAllBtn.style.fontWeight = '600'
  
  downloadAllBtn.onclick = async () => {
    downloadAllBtn.textContent = 'Downloading...'
    downloadAllBtn.disabled = true
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        await downloadBlobSafari(file.blob, file.name)
        await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between downloads
      } catch (error) {
        console.error(`Failed to download ${file.name}:`, error)
      }
    }
    
    downloadAllBtn.textContent = 'All Downloads Initiated'
    setTimeout(() => {
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }, 2000)
  }
  
  container.appendChild(downloadAllBtn)
  
  // Individual file links
  const filesContainer = document.createElement('div')
  filesContainer.style.border = '1px solid #ddd'
  filesContainer.style.borderRadius = '6px'
  filesContainer.style.padding = '10px'
  filesContainer.style.backgroundColor = '#f9f9f9'
  
  files.forEach((file, i) => {
    const fileRow = document.createElement('div')
    fileRow.style.display = 'flex'
    fileRow.style.justifyContent = 'space-between'
    fileRow.style.alignItems = 'center'
    fileRow.style.padding = '8px 0'
    fileRow.style.borderBottom = i < files.length - 1 ? '1px solid #eee' : 'none'
    
    const fileName = document.createElement('span')
    fileName.textContent = file.name
    fileName.style.fontSize = '14px'
    fileName.style.color = '#333'
    fileName.style.flex = '1'
    fileName.style.marginRight = '10px'
    fileName.style.overflow = 'hidden'
    fileName.style.textOverflow = 'ellipsis'
    fileName.style.whiteSpace = 'nowrap'
    
    const downloadBtn = document.createElement('button')
    downloadBtn.textContent = 'Download'
    downloadBtn.style.padding = '4px 12px'
    downloadBtn.style.background = '#34C759'
    downloadBtn.style.color = 'white'
    downloadBtn.style.border = 'none'
    downloadBtn.style.borderRadius = '4px'
    downloadBtn.style.cursor = 'pointer'
    downloadBtn.style.fontSize = '12px'
    
    downloadBtn.onclick = async () => {
      try {
        await downloadBlobSafari(file.blob, file.name)
        downloadBtn.textContent = '✓'
        downloadBtn.style.background = '#28a745'
      } catch (error) {
        console.error(`Failed to download ${file.name}:`, error)
        downloadBtn.textContent = '✗'
        downloadBtn.style.background = '#dc3545'
      }
    }
    
    fileRow.appendChild(fileName)
    fileRow.appendChild(downloadBtn)
    filesContainer.appendChild(fileRow)
  })
  
  container.appendChild(filesContainer)
  
  const closeBtn = document.createElement('button')
  closeBtn.textContent = 'Close'
  closeBtn.style.marginTop = '15px'
  closeBtn.style.padding = '8px 16px'
  closeBtn.style.background = '#6c757d'
  closeBtn.style.color = 'white'
  closeBtn.style.border = 'none'
  closeBtn.style.borderRadius = '4px'
  closeBtn.style.cursor = 'pointer'
  closeBtn.onclick = () => {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }
  container.appendChild(closeBtn)
  
  document.body.appendChild(container)
}

export const downloadZip = async (files: {name:string; blob:Blob}[], name='archive.zip') => {
  const isSafari = isSafariBrowser()
  const supportsLargeBlobs = supportsLargeBlobDownload()
  const maxBlobSize = getMaxBlobSize()
  
  console.log(`Browser: ${isSafari ? 'Safari' : 'Other'}, Large blob support: ${supportsLargeBlobs}, Max size: ${maxBlobSize}`)
  
  // Create ZIP
  const blob = await createZip(files)
  console.log('Downloading ZIP:', name, 'size:', blob.size, 'bytes')
  
  try {
    if (isSafari) {
      // Safari: Use file-saver directly (simpler and more reliable)
      console.log('Using Safari file-saver method')
      const { saveAs } = await import('file-saver')
      saveAs(blob, name)
    } else {
      // Standard blob download for other browsers
      console.log('Using standard blob download')
      downloadBlobAsFile(blob, name)
    }
    
    console.log('Download initiated successfully')
  } catch (error) {
    console.error('Primary download method failed:', error)
    
    if (isSafari) {
      // Safari fallback: try individual files only if file-saver fails
      console.log('Safari file-saver failed, trying individual files as fallback')
      try {
        await downloadIndividualFiles(files)
        return
      } catch (individualError) {
        console.error('Individual files download also failed:', individualError)
      }
    }
    
    // Final fallback to file-saver for all browsers
    try {
      const { saveAs } = await import('file-saver')
      console.log('Using file-saver as final fallback')
      saveAs(blob, name)
    } catch (fallbackError) {
      console.error('All download methods failed:', fallbackError)
      throw new Error('Unable to download file in this browser')
    }
  }
}
