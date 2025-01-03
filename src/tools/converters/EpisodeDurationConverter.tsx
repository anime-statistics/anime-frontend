
export interface EpisodeDurationConverterProps
{
	duration : number;
}

export function EpisodeDurationConverter ({ duration }: EpisodeDurationConverterProps)
{
	const hours   = duration > 60 ? Math.floor(duration / 60) : 0;
	const minutes = duration % 60;

	return (
		<>
			{ hours   > 0 && <span className='me-1'>{ hours } ч</span> }
			{ minutes > 0 && <span className='me-1'>{ minutes } мин</span> }
		</>
	);
}
