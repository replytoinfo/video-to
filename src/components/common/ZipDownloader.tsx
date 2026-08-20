import { downloadZip } from '@/utils/zipManager'
interface Props { files: {name:string; blob:Blob}[]; fileName?:string }
export default function ZipDownloader({ files, fileName='archive.zip' }:Props){
  return <button className="btn-success" onClick={()=>downloadZip(files,fileName)}>Download as ZIP</button>
}
