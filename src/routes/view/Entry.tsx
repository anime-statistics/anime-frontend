
import { useState, useEffect } from 'react';
import { Col, Image, Row, Spinner, Stack } from 'react-bootstrap';

import { ShowDTO } from '../../DTOs/ShowDTO';
import { RequestWithCancellation } from '../../tools/requests/RequestWithCancellation';

import { Information } from './Information';


export interface EntryProps
{
	type       : string;
	identifier : string;
}

export function Entry ({ type, identifier }: EntryProps)
{
	const [ data, setData ] = useState<ShowDTO | null>(null);

	useEffect(function ()
	{
		const req = new RequestWithCancellation(
			`https://shikimori.one/api/${ type }/${ identifier }`,
			(response: any) => setData(response)
		);

		req.handle();
		return req.dispose.bind(req);
	}, [ type, identifier ]);

	if (! data)
	{
		return (
			<Stack direction='horizontal' gap={2} className='justify-content-center m-5'>
				<Spinner />
				<h5 className='m-0'>Загрузка...</h5>
			</Stack>
		);
	}

	return (
		<Row>
			<Col xs='12' md='3'>
				<div>
					<Image fluid rounded src={ 'https://shikimori.one' + data.image.original } className='w-100' />
				</div>
			</Col>

			<Col xs='12' md='9'>
				<h5>{ data.russian }</h5>
				<h6>{ data.name }</h6>

				<Information {...{data}} />
			</Col>
		</Row>
	);
}
