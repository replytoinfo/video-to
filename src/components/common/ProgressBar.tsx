interface Props { 
  value: number;
  label?: string;
}

export default function ProgressBar({ value, label = "Progress" }: Props){
  return (
    <div 
      className="w-full h-2 bg-muted" 
      role="progressbar" 
      aria-valuenow={value} 
      aria-valuemin={0} 
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full bg-primary" style={{width:`${value}%`}}/>
    </div>
  )
}
