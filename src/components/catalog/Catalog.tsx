
import { useState } from 'react';
import { Form, Row, Spinner, Stack } from 'react-bootstrap';
import InfiniteScroll, { Props as InfiniteScrollProps } from 'react-infinite-scroll-component';

import { ItemDTO } from '../../DTOs/ItemDTO';

import { CatalogItem } from './CatalogItem';


export interface CatalogProps extends Omit<InfiniteScrollProps, 'dataLength' | 'loader' | 'children'>
{
	data : ItemDTO[];
	type : string;
}

export function Catalog ({ data, type, ...options }: CatalogProps)
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
				loader     = {
					<Stack direction='horizontal' gap={2} className='justify-content-center m-5'>
						<Spinner />
						<h5 className='m-0'>Загрузка...</h5>
					</Stack>
				}

				{...options}
			>
				<Row className='w-100'>
					{ data.map((item, key) => <CatalogItem key={key} {...{item, type, size}} />) }
				</Row>
			</InfiniteScroll>
		</>
	);
}
