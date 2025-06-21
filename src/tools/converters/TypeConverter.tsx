
export interface TypeConverterProps
{
	data : string;
}

export function TypeConverter ({ data }: TypeConverterProps)
{
	switch (data)
	{
		case 'tv': return <>TV Сериал</>;

		// PG-13 - Детям до 13 лет просмотр не желателен
		case 'pg_13': return <>PG-13</>;
	}

	return <>{ data }</>;
}
