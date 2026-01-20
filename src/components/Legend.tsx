import './Legend.css';

export default function Legend() {
    return (
        <div className="legend">
            <div className="legend-item">
                <div className="legend-shape legend-male"></div>
                <span>남성</span>
            </div>
            <div className="legend-item">
                <div className="legend-shape legend-female"></div>
                <span>여성</span>
            </div>
            <div className="legend-item">
                <div className="legend-line legend-marriage"></div>
                <span>결혼</span>
            </div>
            <div className="legend-item">
                <div className="legend-line legend-divorce"></div>
                <span>이혼</span>
            </div>
            <div className="legend-item">
                <div className="legend-shape legend-death"></div>
                <span>사망</span>
            </div>
            <div className="legend-item">
                <div className="legend-shape legend-unknown">?</div>
                <span>성별 미상</span>
            </div>
            <div className="legend-item">
                <div className="legend-shape legend-pet"></div>
                <span>반려동물</span>
            </div>
            <div className="legend-item">
                <div className="legend-shape legend-pregnancy"></div>
                <span>임신</span>
            </div>
            <div className="legend-item">
                <div className="legend-shape legend-miscarriage"></div>
                <span>자연유산</span>
            </div>
            <div className="legend-item">
                <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block' }}>
                    <polygon points="10,1 19,19 1,19" fill="white" stroke="#919191" strokeWidth="1" />
                    <g stroke="#333" strokeWidth="1">
                        <line x1="4" y1="7.5" x2="16" y2="7.5" />
                        <line x1="7" y1="4.5" x2="13" y2="12.5" />
                        <line x1="13" y1="4.5" x2="7" y2="12.5" />
                    </g>
                </svg>
                <span>인공임신중절</span>
            </div>
            <div className="legend-item">
                <div className="legend-line legend-adopted"></div>
                <span>입양</span>
            </div>
            <div className="legend-item">
                <div className="legend-line legend-foster"></div>
                <span>위탁</span>
            </div>
        </div>
    );
}
