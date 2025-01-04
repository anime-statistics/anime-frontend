
import { useState, useEffect } from 'react';
import { Stack } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';

import { ItemDTO } from '../../DTOs/ItemDTO';
import { RequestWithDelay } from '../../tools/requests/RequestWithDelay';

import { Catalog } from '../catalog/Catalog';
import { Search } from './Search';


export function Navigation ()
{
	const [ search_params, setSearchParams ] = useSearchParams();

	const param_type   = search_params.get('type')   || 'animes';
	const param_search = search_params.get('search') || '';

	const param_page = Number(search_params.get('page') || '1');

	// ===== ===== ===== ===== =====

	const [ type,   setType   ] = useState(param_type);
	const [ search, setSearch ] = useState(param_search);

	const [ hasMore, setHasMore ] = useState(true);
	const [ page,    setPage    ] = useState(param_page);
	const [ data,    setData    ] = useState<ItemDTO[]>([]);

	const next = function (): void
	{
		setPage(page + 1);
	};

	useEffect(function ()
	{
		// useEffect запускается при инициализации.
		// Это приводило к установке page = 1 при инициализации.

		// Использование param_page приводит к неправильной логике.
		// При изменении зависимостей page = search_params.page.

		setHasMore(true);
		data.length > 0 && setPage(1);
		setData([]);
	}, [ type, search ]);

	useEffect(function ()
	{
		setSearchParams({
			page : String(page),

			type,
			search,
		});

		const req = new RequestWithDelay(
			1_000,
			`https://shikimori.one/api/${ type }?search=${ search }&page=${ page }&limit=50`,

			function (response: any): void
			{
				setData(old => [...old, ...response]);

				if (response.length === 50)
				{
					return;
				}
	
				setHasMore(false);
			}
		);

		return req.dispose.bind(req);
	}, [ page, type, search ]);

	return (
		<Stack as='nav' gap={2} className='bg-white p-md-2 rounded'>
			<Search {...{setType, type, setSearch, search}} />
			<Catalog {...{next, hasMore, data, type}} />
		</Stack>
	);
}
