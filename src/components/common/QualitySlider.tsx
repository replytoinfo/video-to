import { Slider } from '@/components/ui/slider'
interface Props { value: number; onChange: (v:number)=>void; min:number; max:number; step:number }
export default function QualitySlider({ value,onChange,min,max,step }:Props){
  return <Slider min={min} max={max} step={step} value={[value]} onValueChange={v=>onChange(v[0])}/>
}
