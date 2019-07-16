import React, { useRef, useEffect, useState, useContext } from 'react';
import { throttle } from 'lodash';
import SkillNode from './SkillNode';
import SkillEdge from './SkillEdge';
import { Skill, ParentPosition, ChildPosition, NodeState } from '../models';
import { Nullable } from '../models/utils';
import SkillContext from '../context/SkillContext';
import { SELECTED_STATE, LOCKED_STATE, UNLOCKED_STATE } from './constants';

interface Props {
  skill: Skill;
  parentPosition: ParentPosition;
  parentNodeId?: string;
  parentState: NodeState;
}

const defaultParentPosition: ChildPosition = {
  top: 0,
  center: 0,
};

const SkillTreeSegment = React.memo(function({
  skill,
  parentNodeId,
  parentPosition,
  parentState,
}: Props) {
  const [childPosition, setChildPosition] = useState(defaultParentPosition);
  const { skills, updateSkillState, decrementSelectedSkillCount } = useContext(
    SkillContext
  );
  const skillNodeRef: React.MutableRefObject<Nullable<HTMLDivElement>> = useRef(
    null
  );

  const nodeState = skills[skill.id];
  const parentNodeIsSelected = !parentNodeId || parentState === SELECTED_STATE;

  useEffect(() => {
    if (nodeState === SELECTED_STATE && !parentNodeIsSelected) {
      decrementSelectedSkillCount();
      return updateSkillState(skill.id, LOCKED_STATE);
    }

    if (nodeState === UNLOCKED_STATE && !parentNodeIsSelected) {
      return updateSkillState(skill.id, LOCKED_STATE);
    }

    if (!parentNodeIsSelected) {
      return;
    }

    if (nodeState === LOCKED_STATE && parentNodeIsSelected) {
      return updateSkillState(skill.id, UNLOCKED_STATE);
    }
  }, [nodeState, parentState]);

  useEffect(() => {
    function calculatePosition() {
      const {
        top,
        left,
        width,
      } = skillNodeRef.current!.getBoundingClientRect();

      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      setChildPosition({
        top: top + scrollY,
        center: left + width / 2 + scrollX,
      });
    }

    window.addEventListener('resize', throttle(calculatePosition, 250));
    calculatePosition();

    return function cleanup() {
      window.removeEventListener('resize', throttle(calculatePosition));
    };
  }, []);

  return (
    <div className="SkillTreeSegment">
      {parentNodeId && (
        <SkillEdge
          nodeState={nodeState}
          position={{
            topX: parentPosition.center,
            topY: parentPosition.bottom,
            bottomX: childPosition.center,
            bottomY: childPosition.top,
          }}
        />
      )}
      <div ref={skillNodeRef}>
        <SkillNode skill={skill} nodeState={nodeState} />
      </div>
    </div>
  );
});

export default SkillTreeSegment;
