
const DATE_OUTPUT_FORMAT : Intl.DateTimeFormatOptions = {
	day   : 'numeric',
	month : 'short',
	year  : 'numeric',
};

export interface ReleaseDateConverterProps
{
	start_date : string | null;
	end_date   : string | null;
}

export function ReleaseDateConverter ({ start_date, end_date }: ReleaseDateConverterProps)
{
	return (
		<>
			{ start_date && <span className='ms-1'>с { (new Date(start_date)).toLocaleString('default', DATE_OUTPUT_FORMAT) }</span> }
			{ end_date   && <span className='ms-1'>по { (new Date(end_date)).toLocaleString('default', DATE_OUTPUT_FORMAT) }</span> }
		</>
	);
}
