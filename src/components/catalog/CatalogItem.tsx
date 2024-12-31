
import { Col } from 'react-bootstrap';

import { ItemDTO } from '../../DTOs/ItemDTO';

import { CatalogCard } from './CatalogCard';


export interface CatalogItemProps
{
	item : ItemDTO;
}

export function CatalogItem ({ item }: CatalogItemProps)
{
	return (
		<Col xs={2}>
			<CatalogCard {...item} />
		</Col>
	);
}
