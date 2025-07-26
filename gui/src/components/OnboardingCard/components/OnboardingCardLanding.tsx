import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { getFontSize } from "../../../util";
import { vscBackground, vscForeground } from "../../vscIndexScript";
import { Br } from "../../vscIndexScript";
import { lightGray } from "../../vscIndexScript";
import { HeaderButtonWithText } from "../../HeaderButtonWithText";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import ElvixLogo from "../../svg/ElvixLogo";

interface OnboardingCardLandingProps {
  onNext: () => void;
  hasModel: boolean;
}

const DISABLED_PROVIDERS_MESSAGE = (
  <p
    style={{
      color: lightGray,
      fontSize: getFontSize() - 2,
      margin: "8px",
    }}
  >
    Some free trial models have been disabled due to high demand. ELVIX AI
    recommends setting up local models for the best experience.{" "}
    <a
      href="https://docs.elvix.ai/walkthroughs/running-continue-without-internet"
      target="_blank"
      style={{
        color: lightGray,
        textDecoration: "underline",
      }}
    >
      Learn more
    </a>
  </p>
);

function OnboardingCardLanding({
  onNext,
  hasModel,
}: OnboardingCardLandingProps) {
  const [warningOpen, setWarningOpen] = useState(false);

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      <ElvixLogo height={75} />
      <Br />
      <h1
        style={{
          fontSize: `${getFontSize() + 4}px`,
          fontWeight: "bold",
          margin: "16px 0 8px 0",
          color: vscForeground,
        }}
      >
        Welcome to ELVIX AI
      </h1>
      <p
        style={{
          color: lightGray,
          fontSize: getFontSize(),
          margin: "0 0 16px 0",
        }}
      >
        Your advanced AI code assistant with powerful local model support for
        enhanced privacy and performance
      </p>

      {!hasModel && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: vscBackground,
            border: "1px solid orange",
            borderRadius: "4px",
            padding: "8px",
            marginBottom: "16px",
            width: "100%",
          }}
        >
          <ExclamationTriangleIcon
            color="orange"
            width="16px"
            style={{ marginRight: "8px" }}
          />
          <p
            style={{
              color: lightGray,
              fontSize: getFontSize() - 2,
              margin: "0",
              flex: 1,
            }}
          >
            You haven't configured any models yet.{" "}
            <span
              style={{
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => setWarningOpen(!warningOpen)}
            >
              Click here to learn why.
            </span>
          </p>
        </div>
      )}

      {warningOpen && DISABLED_PROVIDERS_MESSAGE}

      <HeaderButtonWithText
        onClick={onNext}
        text={hasModel ? "Get started with ELVIX AI" : "Configure ELVIX AI"}
        style={{
          fontSize: getFontSize() + 2,
          padding: "12px 20px",
          borderRadius: "8px",
        }}
      >
        <ArrowRightIcon color={vscBackground} width="16px" height="16px" />
      </HeaderButtonWithText>
    </div>
  );
}

export default OnboardingCardLanding;
