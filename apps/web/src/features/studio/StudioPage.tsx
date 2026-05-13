import React from 'react';
import { useStudioStore } from '../../stores/useStudioStore';
import { UploadZone } from './components/UploadZone';
import { ComparisonSlider } from './components/ComparisonSlider';
import { imageUrl } from '../../api';

export const StudioPage: React.FC = () => {
  const { status, progress, result, processTranslation, reset, file } = useStudioStore();

  return (
    <div className="studio-wrap fup">
      <div className="studio-bar">
        <div className="flex items-center gap-4">
          <span className="sb-badge">STUDIO BETA</span>
          <span className="sb-info">Gateway: Express · Queue: RabbitMQ · DB: MongoDB Atlas</span>
        </div>
        <div className="sb-quota">Runtime: <b>Docker Compose</b></div>
      </div>

      <div className="studio-split">
        {/* LEFT: Controls & Upload */}
        <aside className="sp-left">
          <div className="spl-header">
            <h3 className="spl-title">Source Configuration</h3>
            <button onClick={reset} className="spl-rm">Clear</button>
          </div>

          <UploadZone />

          <div className="spl-bottom">
            <div className="opts-row">
              <span className="opt-label">Detailed Segmentation (OCR)</span>
              <button className="tog on"></button>
            </div>
            <div className="opts-row">
              <span className="opt-label">RabbitMQ Async Processing</span>
              <button className="tog on"></button>
            </div>
            <div className="opts-row">
              <span className="opt-label">Socket.IO Job Updates</span>
              <button className="tog"></button>
            </div>

            <button 
              className="proc-btn" 
              onClick={processTranslation}
              disabled={!file || status === 'uploading' || status === 'processing'}
            >
              {status === 'uploading' ? 'Processing...' : 'Process Image →'}
            </button>
          </div>
        </aside>

        {/* RIGHT: Result Viewer */}
        <div className="sp-right">
          <div className="spr-tabs">
            <button className="spr-tab on">Comparison</button>
            <button className="spr-tab">Single View</button>
            <button className="spr-tab">JSON Schema</button>
            {result && <button className="spr-dl">Download Result</button>}
          </div>

          <div className="flex-grow flex flex-col relative">
            {/* Loader Overlay */}
            {(status === 'uploading' || status === 'processing') && (
              <div className="res-proc show">
                <div className="pspin"></div>
                <div className="plbl font-mono">Running Neural Pipeline...</div>
                <div className="ptrack">
                  <div className="pfill transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="plbl text-[10px] opacity-50">{progress}% Complete</div>
              </div>
            )}

            {/* Empty State */}
            {!result && status === 'idle' && (
              <div className="result-empty">
                <div className="re-circle">❖</div>
                <div className="re-title">No Image Processed</div>
                <div className="re-sub">Upload an image and click "Process" to see the in-image translation results.</div>
              </div>
            )}

            {/* Result Content */}
            {result && (
              <div className="result-content" style={{ display: 'flex' }}>
                <ComparisonSlider 
                  original={imageUrl(result.stages.input)} 
                  translated={imageUrl(result.stages.fuse)} 
                />
                
                <div className="res-metrics">
                  <div className="rm-c">
                    <div className="rm-v">{result.job.completedAt ? 'done' : 'live'}</div>
                    <div className="rm-l">Gateway</div>
                  </div>
                  <div className="rm-c">
                    <div className="rm-v">{String(result.matched_id).slice(0, 8)}</div>
                    <div className="rm-l">Job ID</div>
                  </div>
                  <div className="rm-c">
                    <div className="rm-v">{result.job.status}</div>
                    <div className="rm-l">Status</div>
                  </div>
                  <div className="rm-c">
                    <div className="rm-v">Worker</div>
                    <div className="rm-l">Pipeline</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
