// src/components/ListHeader.js
import React, { useState } from "react";
import { useCookies } from "react-cookie";
import Modal from "./Modal";
import { Settings as Cog } from "lucide-react";

const ListHeader = ({
  listName,
  getData,
  toggleDashboard,
  onSettingsClick,
  onSignOut
}) => {
  const [, , removeCookie] = useCookies(["Email", "AuthToken"]);
  const [showModal, setShowModal] = useState(false);

  const handleSignOut = () => {
    removeCookie("Email", { path: "/" });
    removeCookie("AuthToken", { path: "/" });
    if (onSignOut) onSignOut();
    else window.location.reload();
  };

  return (
    <div className="list-header">
      <h1>{listName}</h1>

      <div className="button-container">
        {/* <button
          className="create"
          onClick={() => setShowModal(true)}
        > */}
          {/* ADD NEW
        </button> */}

        <button
          className="signout"
          onClick={handleSignOut}
        >
          SIGN OUT
        </button>

        <button
          className="settings-link"
          onClick={onSettingsClick}
        >
          <Cog size={16} /> SETTINGS
        </button>

        
      </div>

      {showModal && (
        <Modal
          mode="create"
          setShowModal={setShowModal}
          getData={getData}
        />
      )}
    </div>
  );
};

export default ListHeader;
