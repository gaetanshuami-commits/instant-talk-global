"use client"

export default function VoiceSelector({
value,
onChange
}){

return(

<select

value={value}

onChange={e=>onChange(e.target.value)}

className="bg-gray-700 text-white rounded-full px-3 py-2 text-sm"

>

<option value="female">Voix femme</option>

<option value="male">Voix homme</option>

</select>

)

}
