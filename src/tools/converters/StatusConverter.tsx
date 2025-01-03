
export interface StatusConverterProps
{
	data : string;
}

export function StatusConverter ({ data }: StatusConverterProps)
{
	switch (data)
	{
		case 'released': return <span className='p-1 fw-medium text-success border border-success rounded'>Вышло</span>;
	}

	return <>{ data }</>;
}
