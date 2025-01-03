
import { EpisodeDurationConverter, EpisodeDurationConverterProps } from './EpisodeDurationConverter';


export interface TotalDurationConverterProps extends EpisodeDurationConverterProps
{
	episodes : number;
}

/** (HOURS ч MINUTES мин всего) */
export function TotalDurationConverter ({ duration, episodes }: TotalDurationConverterProps)
{
	return (
		<span>
			&#40;<EpisodeDurationConverter duration = { duration * episodes } />всего&#41;
		</span>
	);
}
