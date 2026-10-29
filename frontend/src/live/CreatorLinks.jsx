import { FiArrowUpRight, FiGithub, FiGlobe } from "react-icons/fi";
import { creator } from "./creator";

export default function CreatorLinks({ className = "" }) {
  return (
    <div className={`td-creator-credit ${className}`}>
      <span className="td-creator-byline">Built by <strong>{creator.name}</strong></span>
      <div className="td-creator-links">
        <a
          href={creator.portfolio}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Aryan Gupta's portfolio (opens in a new tab)"
        >
          <FiGlobe aria-hidden="true" /> Portfolio <FiArrowUpRight aria-hidden="true" />
        </a>
        <a
          href={creator.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Aryan Gupta's GitHub (opens in a new tab)"
        >
          <FiGithub aria-hidden="true" /> GitHub <FiArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
