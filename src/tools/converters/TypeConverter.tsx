
export interface TypeConverterProps
{
	data : string;
}

export function TypeConverter ({ data }: TypeConverterProps)
{
	switch (data)
	{
		case 'tv': return <>TV Сериал</>;
	}

	return <>{ data }</>;
}
