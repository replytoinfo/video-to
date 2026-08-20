interface Props { items: string[] }
export default function PreviewGrid({ items }: Props){
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map(src=> <img key={src} src={src} className="w-full object-cover"/>) }
    </div>
  )
}
