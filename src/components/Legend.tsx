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
        </div>
    );
}
