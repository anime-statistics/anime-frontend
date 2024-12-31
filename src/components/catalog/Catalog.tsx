
import { useState } from 'react';
import { Form, Row, Stack } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';

import { ItemDTO } from '../../DTOs/ItemDTO';

import { CatalogItem } from './CatalogItem';


export interface CatalogProps
{
	next : () => void;
	data : ItemDTO[];
}

export function Catalog ({ next, data }: CatalogProps)
{
	const [ size, setSize ] = useState(2);

	return (
		<>
			<Stack>
				<Form.Range
					title = 'set size'

					min   = {1}
					value = {size}
					max   = {12}

					onChange = { ev => setSize(Number(ev.target.value)) }
				/>
			</Stack>

			<InfiniteScroll
				dataLength = { data.length }
				next       = { next }

				hasMore = {true}
				loader  = {
					<h5 className='m-5 text-center'>Загрузка...</h5>
				}
			>
				<Row>
					{ data.map((item, key) => <CatalogItem key={key} {...{item, size}} />) }
				</Row>
			</InfiniteScroll>
		</>
	);
}
