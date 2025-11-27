import styles from './styles/searchresultbubble.module.css'

export default function SearchResultBubble({ result }) {
    console.log(result);
    return (
        <div className={styles.main}>
            <div className={styles.resultHeader}>
                <span>{result.title}</span>
                <span>{result.author.name}</span>
            </div>
            <div className={styles.resultContent}>
                {result.text}
            </div>
        </div>
    );
};