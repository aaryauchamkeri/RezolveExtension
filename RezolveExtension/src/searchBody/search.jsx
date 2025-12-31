import { useEffect, useRef, useState } from 'react';
import SearchResultBubble from './searchresultbubble';
import styles from './styles/search.module.css'
import { performSearch } from '../utils/requests';
import LoadingAnimation from './loadingAnimation';

function suggestionClickHandler(e, setInput, sendQuery) {
    let qval = e.currentTarget.innerText;
    setInput(qval);
    sendQuery(qval);
}

export default function Search({ renderer }) {
    let [input, setInput] = useState("");
    let [searchResults, setSearchResults] = useState([]);
    let [loadingAnimation, setLoadingAnimation] = useState(false);
    let [stylesState, setStylesState] = useState(' flex flex-col justify-center items-center');

    useEffect(() => {
        setInput("");
        setSearchResults([]);
        setStylesState(' flex flex-col justify-center items-center');
    }, [renderer]);

    const sendQuery = async (ip = input) => {
        setSearchResults([]);
        setLoadingAnimation(true);
        setStylesState(' flex flex-col justify-center items-center');
        let res = await performSearch(ip);
        console.log('res: ', res);
        res = res.response;

        let results = [];

        results.push({ title: 'AI Overview', author: { name: 'Rezolve AI' }, text: res.summary, aiOverview: true, followupQuestions: res.followup_questions });

        for (let i = 0; i < (res.results || []).length; i++) {
            results.push({
                title: res.results[i].file_name,
                author: res.results_authors ? res.results_authors[i] : null,
                text: res.results[i].highlight,
                time_stamp: res.results[i].timestamp,
                aiOverview: false
            });
        }

        setLoadingAnimation(false);
        setStylesState('');
        setSearchResults(results);
    }

    return (
        <div className={styles.main + ' ' + stylesState}>
            {loadingAnimation ? <LoadingAnimation /> : null}
            {searchResults.length ? searchResults.map(val => {
                // the input resets inside the SearhResultBubble
                return <SearchResultBubble result={val} aiOverview={val.aiOverview} input={input} setInput={setInput} sendQuery={sendQuery} />;
            }) : null}
            {!loadingAnimation && !searchResults.length ? <>
                <span className='text-3xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight'>
                    Enterprise Knowledge Search
                </span>
                <p className="w-full max-w-2xl mx-auto text-center text-xl text-slate-600 leading-relaxed">
                    Search your company's knowledge base with AI-powered suggestions and intelligent results
                </p>
                <div className="relative w-full flex justify-center items-center my-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none" />
                    <div className="relative z-10 flex w-full justify-between items-center rounded-2xl bg-white/60 px-4 py-2">
                        <input
                            type="text"
                            placeholder="What are you looking for?"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="bg-transparent w-5/6 h-12 p-2 text-base outline-none"
                        />
                        <button class="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            onClick={(e) => { sendQuery() }}>
                            <i class="fa-solid fa-arrow-right text-lg"></i>
                        </button>
                    </div>
                </div>
                <div className='w-full bg-white px-2 py-4 rounded-md shadow-md flex flex-col gap-2'>
                    <span className='text-sm text-gray-600 font-medium mb-2 ml-2'>Popular Searches</span>
                    <ul class="list-none p-0 m-0">
                        <li class="px-2 py-1 cursor-pointer transition-colors duration-200 rounded hover:bg-gray-100"
                            onClick={(e) => { (suggestionClickHandler(e, setInput, sendQuery)) }}
                        >
                            <i class="fa-solid fa-arrow-trend-up mr-2" />
                            What is the dress code policy?
                        </li>
                        <li class="px-2 py-1 cursor-pointer transition-colors duration-200 rounded hover:bg-gray-100"
                            onClick={(e) => { suggestionClickHandler(e, setInput, sendQuery) }}
                        >
                            <i class="fa-solid fa-arrow-trend-up mr-2" />
                            What is the PTO policy?
                        </li>
                        <li class="px-2 py-1 cursor-pointer transition-colors duration-200 rounded hover:bg-gray-100"
                            onClick={(e) => { suggestionClickHandler(e, setInput, sendQuery) }}
                        >
                            <i class="fa-solid fa-arrow-trend-up mr-2" />
                            What are the best practices?
                        </li>
                    </ul>
                </div>
            </> : null}
        </div>
    )
}