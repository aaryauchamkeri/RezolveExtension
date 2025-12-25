import { useEffect, useRef } from 'react';
import SearchResultBubble from './searchresultbubble';
import styles from './styles/search.module.css'
import { performSearch } from '../utils/requests';

export default function Searches({ results }) {
    return (
        <div className={styles.main}>
            {results.map(val => {
                return <SearchResultBubble result={val} aiOverview={val.aiOverview} />;
            })}
        </div>
    )
}